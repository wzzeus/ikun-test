-- =====================================================
-- 019_more_tasks_and_badge_exchange.sql
-- 增加更多任务 + 徽章兑换积分功能
-- =====================================================

-- =====================================================
-- 1. 新增每日任务：扭蛋、积分兑换、刮刮乐
-- =====================================================

INSERT INTO task_definitions
    (task_key, name, description, schedule, task_type, target_value, reward_points, is_active, auto_claim, sort_order, chain_group_key)
VALUES
    -- 每日扭蛋任务
    ('daily_gacha', '每日扭蛋', '使用扭蛋机1次', 'DAILY', 'GACHA', 1, 30, 1, 1, 55, 'daily_core'),
    -- 每日兑换任务
    ('daily_exchange', '积分商城', '在商城兑换1件商品', 'DAILY', 'EXCHANGE', 1, 15, 1, 1, 65, 'daily_core')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    reward_points = VALUES(reward_points);

-- =====================================================
-- 2. 新增每周任务：扭蛋达人、兑换达人
-- =====================================================

INSERT INTO task_definitions
    (task_key, name, description, schedule, task_type, target_value, reward_points, is_active, auto_claim, sort_order, chain_group_key)
VALUES
    ('weekly_gacha_5', '扭蛋达人', '本周累计扭蛋5次', 'WEEKLY', 'GACHA', 5, 100, 1, 1, 35, 'weekly_core'),
    ('weekly_exchange_3', '购物狂人', '本周累计兑换3次', 'WEEKLY', 'EXCHANGE', 3, 60, 1, 1, 45, 'weekly_core')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    reward_points = VALUES(reward_points);

-- =====================================================
-- 3. 徽章（成就）兑换积分功能
-- 创建徽章兑换记录表
-- =====================================================

CREATE TABLE IF NOT EXISTS badge_exchanges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_key VARCHAR(100) NOT NULL COMMENT '兑换的成就/徽章key',
    exchange_points INT NOT NULL COMMENT '兑换获得的积分',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_achievement (achievement_key),
    INDEX idx_created_at (created_at DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='徽章兑换积分记录';

-- =====================================================
-- 4. 更新积分变动原因 ENUM，添加 BADGE_EXCHANGE
-- =====================================================

ALTER TABLE points_ledger MODIFY COLUMN reason ENUM(
    'SIGNIN_DAILY', 'SIGNIN_STREAK_BONUS',
    'CHEER_GIVE', 'CHEER_RECEIVE',
    'LOTTERY_SPEND', 'LOTTERY_WIN',
    'BET_STAKE', 'BET_PAYOUT', 'BET_REFUND',
    'ADMIN_GRANT', 'ADMIN_DEDUCT',
    'ACHIEVEMENT_CLAIM', 'EASTER_EGG_REDEEM',
    'GACHA_SPEND', 'EXCHANGE_SPEND',
    'TASK_REWARD', 'TASK_CHAIN_BONUS',
    'BADGE_EXCHANGE'
) NOT NULL;

-- =====================================================
-- 5. 添加更多扭蛋机徽章奖励
-- =====================================================

-- 先添加更多徽章成就定义
INSERT INTO achievement_definitions (
    achievement_key, name, description, category, badge_icon, badge_tier, points, target_value, is_active, sort_order
) VALUES
    -- 扭蛋相关徽章
    ('gacha_beginner', '扭蛋新手', '首次使用扭蛋机', 'gacha', 'gift', 'bronze', 100, 1, 1, 200),
    ('gacha_addict', '扭蛋狂人', '累计扭蛋10次', 'gacha', 'gift', 'silver', 300, 10, 1, 201),
    ('gacha_master', '扭蛋大师', '累计扭蛋50次', 'gacha', 'gift', 'gold', 800, 50, 1, 202),

    -- 运气相关徽章
    ('lucky_egg', '幸运蛋', '扭蛋获得稀有奖励', 'gacha', 'star', 'gold', 500, 1, 1, 210),
    ('golden_touch', '点金手', '连续3次扭蛋获得高价值奖励', 'gacha', 'crown', 'diamond', 1000, 1, 1, 211),

    -- 活动相关徽章
    ('daily_warrior', '每日战士', '连续7天完成所有每日任务', 'activity', 'flame', 'gold', 500, 7, 1, 220),
    ('weekly_champion', '周冠军', '连续4周完成所有每周任务', 'activity', 'trophy', 'diamond', 1000, 4, 1, 221),

    -- 社区相关徽章
    ('cheerleader', '啦啦队长', '累计为选手打气100次', 'social', 'heart', 'gold', 500, 100, 1, 230),
    ('prediction_king', '预言家', '竞猜准确率超过80%', 'social', 'zap', 'diamond', 800, 1, 1, 231)

ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    badge_tier = VALUES(badge_tier),
    points = VALUES(points);

-- =====================================================
-- 6. 创建更多扭蛋机彩蛋码（徽章类型为主）
-- =====================================================

INSERT INTO easter_egg_codes (code, reward_type, reward_value, description, hint) VALUES
-- 新徽章奖励
('GACHA-BADGE-001', 'badge', '{"badge_key": "gacha_beginner", "badge_name": "扭蛋新手"}', '扭蛋徽章#1', '恭喜获得「扭蛋新手」徽章！'),
('GACHA-BADGE-002', 'badge', '{"badge_key": "gacha_beginner", "badge_name": "扭蛋新手"}', '扭蛋徽章#2', '恭喜获得「扭蛋新手」徽章！'),
('GACHA-BADGE-003', 'badge', '{"badge_key": "lucky_egg", "badge_name": "幸运蛋"}', '扭蛋徽章#3', '哇！你获得了「幸运蛋」徽章！'),
('GACHA-BADGE-004', 'badge', '{"badge_key": "cheerleader", "badge_name": "啦啦队长"}', '扭蛋徽章#4', '你是最棒的啦啦队长！'),
('GACHA-BADGE-005', 'badge', '{"badge_key": "daily_warrior", "badge_name": "每日战士"}', '扭蛋徽章#5', '战士降临！「每日战士」徽章到手~'),

-- 积分奖励补充
('GACHA-PTS-001', 'points', '{"amount": 100}', '扭蛋积分#1', '100积分入账~'),
('GACHA-PTS-002', 'points', '{"amount": 150}', '扭蛋积分#2', '150积分入账~'),
('GACHA-PTS-003', 'points', '{"amount": 200}', '扭蛋积分#3', '200积分入账~'),
('GACHA-PTS-004', 'points', '{"amount": 250}', '扭蛋积分#4', '250积分入账~'),
('GACHA-PTS-005', 'points', '{"amount": 300}', '扭蛋积分#5', '300积分入账~'),
('GACHA-PTS-006', 'points', '{"amount": 500}', '扭蛋积分#6', '大奖！500积分~'),
('GACHA-PTS-007', 'points', '{"amount": 88}', '扭蛋积分#7', '发发发~88积分'),
('GACHA-PTS-008', 'points', '{"amount": 168}', '扭蛋积分#8', '一路发~168积分'),
('GACHA-PTS-009', 'points', '{"amount": 66}', '扭蛋积分#9', '顺顺顺~66积分'),
('GACHA-PTS-010', 'points', '{"amount": 188}', '扭蛋积分#10', '要发发~188积分'),

-- 道具奖励补充
('GACHA-ITEM-001', 'item', '{"item_type": "cheer", "amount": 5}', '扭蛋道具#1', '5个爱心打气~'),
('GACHA-ITEM-002', 'item', '{"item_type": "coffee", "amount": 3}', '扭蛋道具#2', '3杯咖啡~'),
('GACHA-ITEM-003', 'item', '{"item_type": "star", "amount": 5}', '扭蛋道具#3', '5颗星星~'),
('GACHA-ITEM-004', 'item', '{"item_type": "energy", "amount": 2}', '扭蛋道具#4', '2瓶能量~'),
('GACHA-ITEM-005', 'item', '{"item_type": "pizza", "amount": 3}', '扭蛋道具#5', '3个披萨~');
