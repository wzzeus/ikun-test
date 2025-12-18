"""
任务系统服务层

核心功能：
1. 任务定义 CRUD（管理员可配置）
2. 用户任务进度查询
3. 事件记录与进度更新（幂等）
4. 奖励领取（并发安全）
5. 任务链自动检测与发放

设计要点：
- 幂等性：事件去重 + 领取唯一约束 + 积分账本 request_id
- 并发安全：INSERT IGNORE / ON DUPLICATE KEY UPDATE
- 与积分系统集成：使用 PointsService.add_points
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional, Any, List

from sqlalchemy import select, and_, or_, func, case, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.mysql import insert

from app.models.task import (
    TaskDefinition,
    TaskSchedule,
    TaskType,
    UserTaskProgress,
    UserTaskClaim,
    UserTaskEvent,
)
from app.models.points import PointsReason


@dataclass(frozen=True)
class TaskPeriod:
    """任务周期信息"""
    schedule: TaskSchedule
    period_start: date
    period_end: date


class TaskService:
    """任务系统服务"""

    # =========================================================================
    # 周期计算
    # =========================================================================

    @staticmethod
    def get_period(schedule: TaskSchedule, on_date: Optional[date] = None) -> TaskPeriod:
        """
        计算任务周期

        Args:
            schedule: 任务周期类型（DAILY/WEEKLY）
            on_date: 基准日期，默认今天

        Returns:
            TaskPeriod: 包含周期类型、开始日期、结束日期
        """
        d = on_date or date.today()

        if schedule == TaskSchedule.DAILY:
            return TaskPeriod(schedule=schedule, period_start=d, period_end=d)

        # WEEKLY: 以周一为周期起始
        monday = d - timedelta(days=d.weekday())
        sunday = monday + timedelta(days=6)
        return TaskPeriod(schedule=schedule, period_start=monday, period_end=sunday)

    # =========================================================================
    # 任务定义 CRUD
    # =========================================================================

    @staticmethod
    async def list_definitions(
        db: AsyncSession,
        schedule: Optional[TaskSchedule] = None,
        include_inactive: bool = False,
        now: Optional[datetime] = None,
    ) -> List[TaskDefinition]:
        """
        获取任务定义列表

        Args:
            db: 数据库会话
            schedule: 筛选周期类型
            include_inactive: 是否包含未激活任务
            now: 当前时间（用于有效期过滤）
        """
        now = now or datetime.utcnow()
        conditions = []

        if schedule:
            conditions.append(TaskDefinition.schedule == schedule)

        if not include_inactive:
            conditions.append(TaskDefinition.is_active == True)
            # 有效期过滤
            conditions.append(or_(
                TaskDefinition.starts_at.is_(None),
                TaskDefinition.starts_at <= now
            ))
            conditions.append(or_(
                TaskDefinition.ends_at.is_(None),
                TaskDefinition.ends_at >= now
            ))

        stmt = (
            select(TaskDefinition)
            .where(and_(*conditions) if conditions else True)
            .order_by(TaskDefinition.sort_order.asc(), TaskDefinition.id.asc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_definition_by_id(
        db: AsyncSession,
        task_id: int,
    ) -> Optional[TaskDefinition]:
        """根据ID获取任务定义"""
        result = await db.execute(
            select(TaskDefinition).where(TaskDefinition.id == task_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_definition_by_key(
        db: AsyncSession,
        task_key: str,
    ) -> Optional[TaskDefinition]:
        """根据key获取任务定义"""
        result = await db.execute(
            select(TaskDefinition).where(TaskDefinition.task_key == task_key)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_definition(
        db: AsyncSession,
        task_key: str,
        name: str,
        schedule: TaskSchedule,
        task_type: TaskType,
        target_value: int = 1,
        reward_points: int = 0,
        reward_payload: Optional[dict] = None,
        description: Optional[str] = None,
        is_active: bool = True,
        auto_claim: bool = True,
        sort_order: int = 0,
        starts_at: Optional[datetime] = None,
        ends_at: Optional[datetime] = None,
        chain_group_key: Optional[str] = None,
        chain_requires_group_key: Optional[str] = None,
        created_by: Optional[int] = None,
    ) -> TaskDefinition:
        """创建任务定义"""
        task = TaskDefinition(
            task_key=task_key,
            name=name,
            description=description,
            schedule=schedule,
            task_type=task_type,
            target_value=target_value,
            reward_points=reward_points,
            reward_payload=reward_payload,
            is_active=is_active,
            auto_claim=auto_claim,
            sort_order=sort_order,
            starts_at=starts_at,
            ends_at=ends_at,
            chain_group_key=chain_group_key,
            chain_requires_group_key=chain_requires_group_key,
            created_by=created_by,
        )
        db.add(task)
        await db.flush()
        return task

    @staticmethod
    async def update_definition(
        db: AsyncSession,
        task_id: int,
        **fields: Any,
    ) -> Optional[TaskDefinition]:
        """更新任务定义"""
        result = await db.execute(
            select(TaskDefinition).where(TaskDefinition.id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return None

        for key, value in fields.items():
            if hasattr(task, key) and value is not None:
                setattr(task, key, value)

        await db.flush()
        return task

    @staticmethod
    async def deactivate_definition(
        db: AsyncSession,
        task_id: int,
    ) -> bool:
        """停用任务定义"""
        result = await db.execute(
            select(TaskDefinition).where(TaskDefinition.id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return False

        task.is_active = False
        await db.flush()
        return True

    @staticmethod
    def serialize_definition(task: TaskDefinition) -> dict:
        """序列化任务定义"""
        return {
            "id": task.id,
            "task_key": task.task_key,
            "name": task.name,
            "description": task.description,
            "schedule": task.schedule.value if isinstance(task.schedule, TaskSchedule) else task.schedule,
            "task_type": task.task_type.value if isinstance(task.task_type, TaskType) else task.task_type,
            "target_value": task.target_value,
            "reward_points": task.reward_points,
            "reward_payload": task.reward_payload,
            "is_active": bool(task.is_active),
            "auto_claim": bool(task.auto_claim),
            "sort_order": task.sort_order,
            "starts_at": task.starts_at.isoformat() if task.starts_at else None,
            "ends_at": task.ends_at.isoformat() if task.ends_at else None,
            "chain_group_key": task.chain_group_key,
            "chain_requires_group_key": task.chain_requires_group_key,
            "created_by": task.created_by,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None,
        }

    # =========================================================================
    # 用户任务查询
    # =========================================================================

    @staticmethod
    async def get_user_tasks(
        db: AsyncSession,
        user_id: int,
        schedule: TaskSchedule,
        on_date: Optional[date] = None,
        now: Optional[datetime] = None,
    ) -> dict:
        """
        获取用户任务列表（含进度）

        Returns:
            {
                "schedule": "DAILY",
                "period_start": "2025-01-15",
                "period_end": "2025-01-15",
                "items": [
                    {
                        "task": {...},
                        "progress": {
                            "progress_value": 2,
                            "target_value": 3,
                            "is_completed": false,
                            "is_claimed": false,
                            "progress_percent": 66
                        }
                    }
                ],
                "stats": {"total": 6, "completed": 3, "claimed": 2}
            }
        """
        now = now or datetime.utcnow()
        period = TaskService.get_period(schedule, on_date=on_date)

        # 获取有效的任务定义
        definitions = await TaskService.list_definitions(
            db=db,
            schedule=schedule,
            include_inactive=False,
            now=now,
        )

        if not definitions:
            return {
                "schedule": schedule.value,
                "period_start": period.period_start.isoformat(),
                "period_end": period.period_end.isoformat(),
                "items": [],
                "stats": {"total": 0, "completed": 0, "claimed": 0},
            }

        # 批量查询用户进度
        task_ids = [d.id for d in definitions]
        result = await db.execute(
            select(UserTaskProgress).where(
                UserTaskProgress.user_id == user_id,
                UserTaskProgress.task_id.in_(task_ids),
                UserTaskProgress.period_start == period.period_start,
            )
        )
        progress_map = {p.task_id: p for p in result.scalars().all()}

        # 组装结果
        items = []
        completed_count = 0
        claimed_count = 0

        for task in definitions:
            progress = progress_map.get(task.id)
            progress_value = progress.progress_value if progress else 0
            target_value = progress.target_value if progress else task.target_value

            is_completed = bool(progress and progress.completed_at) or (
                progress_value >= target_value and target_value > 0
            )
            is_claimed = bool(progress and progress.claimed_at)

            if is_completed:
                completed_count += 1
            if is_claimed:
                claimed_count += 1

            progress_percent = (
                min(100, int((progress_value / target_value) * 100))
                if target_value > 0 else 0
            )

            items.append({
                "task": TaskService.serialize_definition(task),
                "progress": {
                    "period_start": period.period_start.isoformat(),
                    "period_end": period.period_end.isoformat(),
                    "progress_value": progress_value,
                    "target_value": target_value,
                    "completed_at": progress.completed_at.isoformat() if progress and progress.completed_at else None,
                    "claimed_at": progress.claimed_at.isoformat() if progress and progress.claimed_at else None,
                    "last_event_at": progress.last_event_at.isoformat() if progress and progress.last_event_at else None,
                    "is_completed": is_completed,
                    "is_claimed": is_claimed,
                    "progress_percent": progress_percent,
                },
            })

        return {
            "schedule": schedule.value,
            "period_start": period.period_start.isoformat(),
            "period_end": period.period_end.isoformat(),
            "items": items,
            "stats": {
                "total": len(items),
                "completed": completed_count,
                "claimed": claimed_count,
            },
        }

    # =========================================================================
    # 事件记录与进度更新
    # =========================================================================

    @staticmethod
    async def record_event(
        db: AsyncSession,
        user_id: int,
        task_type: TaskType,
        delta: int = 1,
        event_key: Optional[str] = None,
        ref_type: Optional[str] = None,
        ref_id: Optional[int] = None,
        now: Optional[datetime] = None,
        auto_claim: bool = True,
    ) -> dict:
        """
        记录用户行为事件，自动更新任务进度

        Args:
            user_id: 用户ID
            task_type: 任务类型
            delta: 进度增量（默认1）
            event_key: 事件幂等key（如 "cheer:123"）
            ref_type: 关联类型（如 "cheer"）
            ref_id: 关联ID
            auto_claim: 是否自动领取奖励

        Returns:
            {"updated": 2, "claimed": 1, "skipped": 0}

        Usage:
            await TaskService.record_event(
                db=db,
                user_id=user_id,
                task_type=TaskType.CHEER,
                event_key=f"cheer:{cheer.id}",
                ref_type="cheer",
                ref_id=cheer.id,
            )
        """
        if delta <= 0:
            return {"updated": 0, "claimed": 0, "skipped": 0}

        now = now or datetime.utcnow()
        updated = 0
        claimed = 0
        skipped = 0

        # 同一事件同时驱动 DAILY 和 WEEKLY 任务
        for schedule in (TaskSchedule.DAILY, TaskSchedule.WEEKLY):
            period = TaskService.get_period(schedule, on_date=date.today())

            # 事件去重
            if event_key:
                inserted = await TaskService._insert_event_dedupe(
                    db=db,
                    user_id=user_id,
                    schedule=schedule,
                    period_start=period.period_start,
                    task_type=task_type,
                    event_key=event_key,
                    ref_type=ref_type,
                    ref_id=ref_id,
                )
                if not inserted:
                    skipped += 1
                    continue

            # 查找匹配的任务定义
            definitions = await TaskService._match_definitions(
                db=db,
                schedule=schedule,
                task_type=task_type,
                now=now,
            )

            if not definitions:
                continue

            for task in definitions:
                # CHAIN_BONUS 不由事件直接驱动
                if task.task_type == TaskType.CHAIN_BONUS:
                    continue

                # 更新进度
                progress = await TaskService._increment_progress(
                    db=db,
                    user_id=user_id,
                    definition=task,
                    period=period,
                    delta=delta,
                    now=now,
                )

                if progress:
                    updated += 1

                    # 自动领取
                    if auto_claim and task.auto_claim:
                        result = await TaskService._maybe_auto_claim(
                            db=db,
                            user_id=user_id,
                            progress=progress,
                            definition=task,
                        )
                        if result:
                            claimed += 1

            # 检查任务链奖励
            chain_claimed = await TaskService._check_and_award_chain_bonuses(
                db=db,
                user_id=user_id,
                schedule=schedule,
                period=period,
                now=now,
            )
            claimed += chain_claimed

        return {"updated": updated, "claimed": claimed, "skipped": skipped}

    @staticmethod
    async def _match_definitions(
        db: AsyncSession,
        schedule: TaskSchedule,
        task_type: TaskType,
        now: datetime,
    ) -> List[TaskDefinition]:
        """匹配任务定义"""
        stmt = (
            select(TaskDefinition)
            .where(
                TaskDefinition.is_active == True,
                TaskDefinition.schedule == schedule,
                TaskDefinition.task_type == task_type,
                or_(TaskDefinition.starts_at.is_(None), TaskDefinition.starts_at <= now),
                or_(TaskDefinition.ends_at.is_(None), TaskDefinition.ends_at >= now),
            )
            .order_by(TaskDefinition.sort_order.asc(), TaskDefinition.id.asc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def _insert_event_dedupe(
        db: AsyncSession,
        user_id: int,
        schedule: TaskSchedule,
        period_start: date,
        task_type: TaskType,
        event_key: str,
        ref_type: Optional[str],
        ref_id: Optional[int],
    ) -> bool:
        """
        插入事件去重记录（INSERT IGNORE）

        Returns:
            True: 首次处理
            False: 重复事件，应跳过
        """
        stmt = (
            insert(UserTaskEvent)
            .values(
                user_id=user_id,
                schedule=schedule,
                period_start=period_start,
                task_type=task_type,
                event_key=event_key,
                ref_type=ref_type,
                ref_id=ref_id,
            )
            .prefix_with("IGNORE")
        )
        result = await db.execute(stmt)
        # MySQL: INSERT IGNORE 成功返回 rowcount=1，重复返回 0
        return bool(getattr(result, "rowcount", 0))

    @staticmethod
    async def _increment_progress(
        db: AsyncSession,
        user_id: int,
        definition: TaskDefinition,
        period: TaskPeriod,
        delta: int,
        now: datetime,
    ) -> Optional[UserTaskProgress]:
        """
        并发安全的进度累加

        使用 INSERT ... ON DUPLICATE KEY UPDATE 实现原子操作
        """
        target = max(1, int(definition.target_value or 1))
        delta = int(delta)

        # 构建 INSERT ... ON DUPLICATE KEY UPDATE
        stmt = insert(UserTaskProgress).values(
            user_id=user_id,
            task_id=definition.id,
            period_start=period.period_start,
            period_end=period.period_end,
            progress_value=min(delta, target),
            target_value=target,
            completed_at=(now if delta >= target else None),
            last_event_at=now,
        )

        # ON DUPLICATE KEY UPDATE
        stmt = stmt.on_duplicate_key_update(
            period_end=period.period_end,
            target_value=target,
            progress_value=func.least(target, UserTaskProgress.progress_value + delta),
            completed_at=case(
                (
                    and_(
                        UserTaskProgress.completed_at.is_(None),
                        func.least(target, UserTaskProgress.progress_value + delta) >= target
                    ),
                    now,
                ),
                else_=UserTaskProgress.completed_at,
            ),
            last_event_at=now,
        )

        await db.execute(stmt)
        await db.flush()

        # 回读进度记录
        result = await db.execute(
            select(UserTaskProgress).where(
                UserTaskProgress.user_id == user_id,
                UserTaskProgress.task_id == definition.id,
                UserTaskProgress.period_start == period.period_start,
            )
        )
        return result.scalar_one_or_none()

    # =========================================================================
    # 奖励领取
    # =========================================================================

    @staticmethod
    def _derive_claim_request_id(user_id: int, task_id: int, period_start: date) -> str:
        """生成稳定的领取请求ID"""
        return f"task:{user_id}:{task_id}:{period_start.isoformat()}"[:64]

    @staticmethod
    async def _maybe_auto_claim(
        db: AsyncSession,
        user_id: int,
        progress: UserTaskProgress,
        definition: TaskDefinition,
    ) -> Optional[dict]:
        """尝试自动领取奖励"""
        if not progress:
            return None
        if progress.claimed_at:
            return None
        if not progress.completed_at and progress.progress_value < progress.target_value:
            return None

        return await TaskService.claim_task_reward(
            db=db,
            user_id=user_id,
            task_id=definition.id,
            request_id=None,
        )

    @staticmethod
    async def claim_task_reward(
        db: AsyncSession,
        user_id: int,
        task_id: int,
        request_id: Optional[str] = None,
        now: Optional[datetime] = None,
    ) -> dict:
        """
        领取任务奖励（并发安全 + 幂等）

        设计要点：
        1. user_task_claims 的 UNIQUE 约束防重复领取
        2. request_id 贯穿到 points_ledger 保证积分发放幂等
        3. INSERT IGNORE 处理并发冲突

        Returns:
            {
                "success": True,
                "task_id": 1,
                "already_claimed": False,
                "period_start": "2025-01-15",
                "reward_points": 20,
                "request_id": "task:123:1:2025-01-15"
            }
        """
        now = now or datetime.utcnow()

        # 获取任务定义
        result = await db.execute(
            select(TaskDefinition).where(TaskDefinition.id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task or not task.is_active:
            raise ValueError("任务不存在或未启用")

        period = TaskService.get_period(task.schedule, on_date=date.today())
        claim_request_id = (
            request_id or TaskService._derive_claim_request_id(user_id, task_id, period.period_start)
        )[:64]

        # 获取进度
        result = await db.execute(
            select(UserTaskProgress).where(
                UserTaskProgress.user_id == user_id,
                UserTaskProgress.task_id == task_id,
                UserTaskProgress.period_start == period.period_start,
            )
        )
        progress = result.scalar_one_or_none()

        if not progress or (not progress.completed_at and progress.progress_value < progress.target_value):
            raise ValueError("任务未完成，无法领取")

        # 插入领取记录（INSERT IGNORE 处理并发）
        stmt = (
            insert(UserTaskClaim)
            .values(
                user_id=user_id,
                task_id=task_id,
                period_start=period.period_start,
                reward_points=int(task.reward_points or 0),
                reward_payload=task.reward_payload,
                request_id=claim_request_id,
                claimed_at=now,
            )
            .prefix_with("IGNORE")
        )
        insert_result = await db.execute(stmt)
        inserted = bool(getattr(insert_result, "rowcount", 0))

        # 已存在：幂等返回
        if not inserted:
            existing = await db.execute(
                select(UserTaskClaim).where(
                    UserTaskClaim.user_id == user_id,
                    UserTaskClaim.task_id == task_id,
                    UserTaskClaim.period_start == period.period_start,
                )
            )
            claim = existing.scalar_one_or_none()

            # 更新 progress.claimed_at
            if progress and not progress.claimed_at:
                progress.claimed_at = claim.claimed_at if claim else now
                await db.flush()

            return {
                "success": True,
                "task_id": task_id,
                "already_claimed": True,
                "period_start": period.period_start.isoformat(),
                "reward_points": claim.reward_points if claim else int(task.reward_points or 0),
                "request_id": claim.request_id if claim else claim_request_id,
            }

        # 回读 claim 记录
        claim_result = await db.execute(
            select(UserTaskClaim).where(UserTaskClaim.request_id == claim_request_id)
        )
        claim = claim_result.scalar_one_or_none()

        # 发放积分
        awarded_points = int(task.reward_points or 0)
        if awarded_points > 0:
            from app.services.points_service import PointsService

            reason = (
                PointsReason.TASK_CHAIN_BONUS
                if task.task_type == TaskType.CHAIN_BONUS
                else PointsReason.TASK_REWARD
            )

            try:
                await PointsService.add_points(
                    db=db,
                    user_id=user_id,
                    amount=awarded_points,
                    reason=reason,
                    ref_type="task_claim",
                    ref_id=claim.id if claim else None,
                    description=f"任务奖励：{task.name}",
                    request_id=claim_request_id,
                    auto_commit=False,
                )
            except IntegrityError:
                # points_ledger.request_id 已存在：幂等处理
                pass

        # 更新 progress.claimed_at
        if progress and not progress.claimed_at:
            progress.claimed_at = now
            await db.flush()

        return {
            "success": True,
            "task_id": task_id,
            "already_claimed": False,
            "period_start": period.period_start.isoformat(),
            "reward_points": awarded_points,
            "request_id": claim_request_id,
        }

    # =========================================================================
    # 任务链检查与发放
    # =========================================================================

    @staticmethod
    async def _check_and_award_chain_bonuses(
        db: AsyncSession,
        user_id: int,
        schedule: TaskSchedule,
        period: TaskPeriod,
        now: datetime,
    ) -> int:
        """
        检查并发放任务链奖励

        逻辑：
        1. 找到所有 CHAIN_BONUS 类型任务
        2. 检查其依赖的 chain_requires_group_key 组内任务是否全部完成
        3. 全部完成则自动完成链任务并发放奖励
        """
        # 查找链奖励任务
        result = await db.execute(
            select(TaskDefinition).where(
                TaskDefinition.is_active == True,
                TaskDefinition.schedule == schedule,
                TaskDefinition.task_type == TaskType.CHAIN_BONUS,
                or_(TaskDefinition.starts_at.is_(None), TaskDefinition.starts_at <= now),
                or_(TaskDefinition.ends_at.is_(None), TaskDefinition.ends_at >= now),
            )
        )
        chain_definitions = list(result.scalars().all())

        if not chain_definitions:
            return 0

        claimed = 0

        for chain_task in chain_definitions:
            required_group = chain_task.chain_requires_group_key
            if not required_group:
                continue

            # 查找依赖组内的任务
            req_result = await db.execute(
                select(TaskDefinition).where(
                    TaskDefinition.is_active == True,
                    TaskDefinition.schedule == schedule,
                    TaskDefinition.task_type != TaskType.CHAIN_BONUS,
                    TaskDefinition.chain_group_key == required_group,
                    or_(TaskDefinition.starts_at.is_(None), TaskDefinition.starts_at <= now),
                    or_(TaskDefinition.ends_at.is_(None), TaskDefinition.ends_at >= now),
                )
            )
            required_tasks = list(req_result.scalars().all())

            if not required_tasks:
                continue

            required_ids = [t.id for t in required_tasks]
            total_required = len(required_ids)

            # 统计已完成数量
            completed_result = await db.execute(
                select(func.count(UserTaskProgress.id)).where(
                    UserTaskProgress.user_id == user_id,
                    UserTaskProgress.period_start == period.period_start,
                    UserTaskProgress.task_id.in_(required_ids),
                    UserTaskProgress.completed_at.isnot(None),
                )
            )
            completed_count = int(completed_result.scalar() or 0)

            if completed_count < total_required:
                continue

            # 标记链任务完成
            chain_progress = await TaskService._increment_progress(
                db=db,
                user_id=user_id,
                definition=chain_task,
                period=period,
                delta=1,
                now=now,
            )

            if not chain_progress:
                continue

            # 自动领取
            if chain_task.auto_claim:
                result = await TaskService._maybe_auto_claim(
                    db=db,
                    user_id=user_id,
                    progress=chain_progress,
                    definition=chain_task,
                )
                if result:
                    claimed += 1

        return claimed
