"""
老虎机配置数据模型
支持管理员配置符号、倍率、权重来控制胜率
"""
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, DECIMAL, Enum
)
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class SlotWinType(str, enum.Enum):
    """老虎机中奖类型"""
    NONE = "none"      # 未中奖
    TWO = "two"        # 两个相同
    THREE = "three"    # 三个相同


class SlotMachineConfig(BaseModel):
    """老虎机配置"""
    __tablename__ = "slot_machine_configs"

    name = Column(String(100), nullable=False, default="幸运老虎机", comment="配置名称")
    is_active = Column(Boolean, nullable=False, default=True, comment="是否启用")
    cost_points = Column(Integer, nullable=False, default=30, comment="每次消耗积分")
    reels = Column(Integer, nullable=False, default=3, comment="滚轴数量")
    two_kind_multiplier = Column(DECIMAL(6, 2), nullable=False, default=1.50, comment="两连奖励倍数")
    jackpot_symbol_key = Column(String(50), nullable=False, default="seven", comment="大奖符号key")
    daily_limit = Column(Integer, nullable=True, default=20, comment="每日限制次数")
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # 关系
    symbols = relationship("SlotMachineSymbol", back_populates="config", lazy="selectin")
    draws = relationship("SlotMachineDraw", back_populates="config")


class SlotMachineSymbol(BaseModel):
    """老虎机符号配置"""
    __tablename__ = "slot_machine_symbols"

    config_id = Column(Integer, ForeignKey("slot_machine_configs.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol_key = Column(String(50), nullable=False, comment="符号唯一key")
    emoji = Column(String(32), nullable=False, comment="展示emoji")
    name = Column(String(50), nullable=False, comment="名称")
    multiplier = Column(Integer, nullable=False, default=1, comment="三连倍率")
    weight = Column(Integer, nullable=False, default=1, comment="权重（越大出现概率越高）")
    sort_order = Column(Integer, nullable=False, default=0, comment="排序")
    is_enabled = Column(Boolean, nullable=False, default=True, comment="是否启用")
    is_jackpot = Column(Boolean, nullable=False, default=False, comment="是否大奖符号")

    # 关系
    config = relationship("SlotMachineConfig", back_populates="symbols")


class SlotMachineDraw(BaseModel):
    """老虎机抽奖记录"""
    __tablename__ = "slot_machine_draws"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    config_id = Column(Integer, ForeignKey("slot_machine_configs.id", ondelete="CASCADE"), nullable=False, index=True)
    cost_points = Column(Integer, nullable=False, comment="消费积分")
    reel_1 = Column(String(50), nullable=False, comment="第一个滚轴结果")
    reel_2 = Column(String(50), nullable=False, comment="第二个滚轴结果")
    reel_3 = Column(String(50), nullable=False, comment="第三个滚轴结果")
    win_type = Column(Enum(SlotWinType), nullable=False, default=SlotWinType.NONE, comment="中奖类型")
    multiplier = Column(DECIMAL(10, 2), nullable=False, default=0, comment="倍率")
    payout_points = Column(Integer, nullable=False, default=0, comment="获得积分")
    is_jackpot = Column(Boolean, nullable=False, default=False, comment="是否大奖")
    request_id = Column(String(64), nullable=True, unique=True, comment="幂等请求ID")

    # 关系
    user = relationship("User", backref="slot_draws")
    config = relationship("SlotMachineConfig", back_populates="draws")
