# 数据库初始化说明

## 文件说明

### `production_clean_db.sql` - 生产环境初始数据库
包含完整的表结构 + 配置数据 + 1个示例报名项目

**包含内容**：
- ✅ 50个数据表结构（完整）
- ✅ 配置数据：
  - 1个比赛（第一届鸡王争霸赛）
  - 33个成就定义
  - 16个任务定义
  - 2个抽奖配置 + 15个抽奖奖品
  - 1个扭蛋配置 + 18个扭蛋奖品
  - 1个老虎机配置
  - 8个积分兑换商品
  - 30个API Key兑换码（奖池）
  - 2条系统公告
- ✅ 示例数据：
  - 1个用户（user841 - 枫枫 北）
  - 1个报名项目（API Key Tool）

**不包含**：
- ❌ 用户测试数据
- ❌ 积分记录
- ❌ GitHub统计数据
- ❌ 请求日志

## 使用方法

### 本地开发环境初始化

```bash
# 1. 创建数据库
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS chicken_king CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 导入初始数据
mysql -u root -proot chicken_king < backend/sql/production_clean_db.sql

# 3. 验证数据
mysql -u root -proot chicken_king -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM registrations; SELECT COUNT(*) FROM contests;"
```

### 生产环境部署

生产环境通过 webhook 自动部署时会自动执行：

1. 创建数据库（如果不存在）
2. 导入 `production_clean_db.sql`
3. 执行迁移脚本（`0xx_*.sql`）

## 迁移文件说明

迁移文件按序号顺序执行：
- `001_*.sql` - 首次迁移（已废弃，包含在 schema.sql 中）
- `002_*.sql` - GitHub 和应援系统
- `003_*.sql` - 积分系统
- ...
- `017_*.sql` - 兑换系统

**注意**：`production_clean_db.sql` 已经包含所有迁移，无需再执行历史迁移。

## 数据统计

```
核心数据：
- users: 1
- registrations: 1
- contests: 1

配置数据：
- achievement_definitions: 33
- task_definitions: 16
- lottery_prizes: 15
- gacha_prizes: 18
- exchange_items: 8
- api_key_codes: 30
```

## 清理脚本

如需重新生成干净的初始数据库：

```bash
# 清理用户数据（保留配置）
mysql -u root -proot chicken_king << 'EOF'
DELETE FROM github_stats;
DELETE FROM github_sync_logs;
DELETE FROM points_ledger;
DELETE FROM user_points;
DELETE FROM user_achievements;
DELETE FROM user_stats;
DELETE FROM daily_signins;
DELETE FROM lottery_draws;
DELETE FROM gacha_draws;
DELETE FROM slot_machine_draws;
DELETE FROM scratch_cards;
DELETE FROM submissions;
DELETE FROM votes;
DELETE FROM cheers;
DELETE FROM prediction_bets;
DELETE FROM exchange_records;
TRUNCATE TABLE request_logs;
TRUNCATE TABLE system_logs;
EOF

# 重新导出
mysqldump -u root -proot chicken_king \
  --single-transaction \
  --no-create-db \
  --complete-insert \
  --skip-extended-insert \
  --no-tablespaces \
  > backend/sql/production_clean_db.sql
```
