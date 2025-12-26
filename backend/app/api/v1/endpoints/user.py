"""
用户相关 API
"""
from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status, File, UploadFile
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.core.config import settings
from app.models.user import User
from app.services.media_service import AVATAR_MAX_BYTES, delete_media_file, save_upload_file

router = APIRouter()

# 有效角色列表
VALID_ROLES = ["admin", "reviewer", "contestant", "spectator"]
# 用户自选角色白名单（只能选这两个）
SELECTABLE_ROLES = ["contestant", "spectator"]



class UserResponse(BaseModel):
    """用户响应模型"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str  # admin / reviewer / contestant / spectator
    original_role: Optional[str] = None  # 用户的原始角色（管理员角色切换用）
    role_selected: bool = False  # 是否已完成角色选择引导
    role_selected_at: Optional[datetime] = None  # 角色选择时间
    is_active: bool
    linux_do_id: Optional[str] = None
    linux_do_username: Optional[str] = None
    trust_level: Optional[int] = None
    is_silenced: bool = False


async def get_current_user_optional(
    authorization: str = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """可选 JWT 认证依赖，未登录返回 None"""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)

    if not payload or "sub" not in payload:
        return None

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    return user


async def get_current_user_dep(
    authorization: str = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """JWT 认证依赖"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请先登录",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录已过期，请重新登录",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证信息",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )

    return user


@router.get("/me", response_model=UserResponse, summary="获取当前用户信息")
async def get_current_user(
    current_user: User = Depends(get_current_user_dep),
):
    """获取当前登录用户的完整信息，包含角色"""
    return UserResponse.model_validate(current_user)


@router.post("/me/avatar", response_model=UserResponse, summary="上传头像")
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    """上传头像"""
    media = await save_upload_file(file, "avatars", AVATAR_MAX_BYTES)
    old_url = current_user.avatar_url
    current_user.avatar_url = media.url
    await db.commit()
    await db.refresh(current_user)
    delete_media_file(old_url)
    return UserResponse.model_validate(current_user)


@router.put("/me")
async def update_current_user():
    """更新当前用户信息"""
    # TODO: 实现更新逻辑
    return {"message": "更新用户接口"}


@router.get("/{user_id}")
async def get_user(user_id: int):
    """获取指定用户信息"""
    # TODO: 实现查询逻辑
    return {"message": f"获取用户 {user_id}"}


class RoleSwitchRequest(BaseModel):
    """角色切换请求"""
    role: str


@router.post("/me/switch-role", response_model=UserResponse, summary="切换用户角色（管理员专属）")
async def switch_role(
    request: RoleSwitchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    """
    切换当前用户的角色（管理员专属功能）

    - **role**: 目标角色 (admin, reviewer, contestant, spectator)

    只有数据库中 original_role 为 admin 的用户可以使用此功能。
    首次切换时会自动记录原始角色。
    """
    # 获取用户的原始角色（如果未设置，则使用当前角色）
    original_role = current_user.original_role or current_user.role

    # 只有原始角色是管理员的用户才能使用此功能
    if original_role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="角色切换功能仅管理员可用"
        )

    # 验证角色值
    if request.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的角色值，可选值: {', '.join(VALID_ROLES)}"
        )

    # 如果原始角色未设置，先记录
    if current_user.original_role is None:
        current_user.original_role = current_user.role

    # 更新用户角色
    current_user.role = request.role
    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


class RoleSelectRequest(BaseModel):
    """角色选择请求（新用户引导页专用）"""
    role: Literal["contestant", "spectator"]


@router.post("/me/select-role", response_model=UserResponse, summary="选择用户角色（新用户引导）")
async def select_role(
    request: RoleSelectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    """
    新用户角色选择（引导页使用）

    - **role**: 目标角色，只能选择 contestant（参赛者）或 spectator（吃瓜群众）

    业务规则：
    1. admin/reviewer 用户不能使用此接口（由后台分配）
    2. 已选择过角色的用户不能重复选择
    3. 参赛者不能反悔改成吃瓜群众
    """
    # 获取用户的真实身份（优先检查 original_role，防止管理员切换角色后绕过限制）
    real_role = current_user.original_role or current_user.role

    # 管理员和评审员不能通过此接口改角色
    if real_role in ('admin', 'reviewer'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理员和评审员角色由系统分配，不能自行修改"
        )

    # 已经选过角色的用户不能重复选择（幂等：相同角色允许）
    if current_user.role_selected and current_user.role != request.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="你已经选择过角色，不能重复修改"
        )

    # 参赛者不能反悔改成吃瓜群众
    if current_user.role == 'contestant' and request.role == 'spectator':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="参赛者不能改为吃瓜群众，你已经踏上征途了！"
        )

    # 更新角色和选择状态
    current_user.role = request.role
    current_user.role_selected = True
    current_user.role_selected_at = datetime.utcnow()

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)
