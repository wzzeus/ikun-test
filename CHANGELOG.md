# 更新日志

## 2025-12-22

### 🎯 重要更新

#### 1. GitHub 同步功能修复与优化

**修复的问题**：
- ✅ GitHub API 速率限制导致同步失败
- ✅ GitHub API 时区问题导致返回 0 commits
- ✅ 前端查询天数过长（60天 → 7天）

**解决方案**：
- 添加 `GITHUB_TOKEN` 配置，速率限制从 60次/小时 → 5000次/小时
- 修复 `isoformat()` 缺少 UTC 时区标识 `Z`
- 前端默认查询改为 7 天，减轻 API 负担

**配置文件**：
```bash
# backend/.env
GITHUB_TOKEN=github_pat_xxxxx
```

**相关文件**：
- `backend/app/services/github_service.py:98-100` - 添加 `Z` 时区标识
- `frontend/src/components/participant/ParticipantDetailModal.jsx:503` - 改为 7 天
- `backend/app/api/v1/endpoints/github.py:295` - 限制改为 90 天

---

#### 2. 报名 API Key 保存 Bug 修复

**问题**：报名时填写的 `api_key` 字段没有保存到数据库

**原因**：后端创建报名接口忘记写 `api_key=payload.api_key`

**修复**：
- ✅ 创建报名时保存 `api_key`
- ✅ 撤回后重新报名时保存 `api_key` 和 `repo_url`

**相关文件**：
- `backend/app/api/v1/endpoints/registration.py:210` - 撤回重新报名
- `backend/app/api/v1/endpoints/registration.py:245` - 创建新报名

---

#### 3. 前端 Radix UI Dialog 无障碍修复

**问题**：DialogContent 缺少 DialogTitle，影响屏幕阅读器

**修复**：使用 `DialogTitle` 包裹在 `VisuallyHidden` 中

**相关文件**：
- `frontend/src/components/participant/ParticipantDetailModal.jsx:6,688`

---

#### 4. 数据库初始化自动化

**新功能**：
- ✅ 生成生产环境初始数据库 `production_clean_db.sql` (166KB)
- ✅ Webhook 部署脚本自动初始化数据库
- ✅ 包含完整的表结构 + 配置 + 示例报名

**包含内容**：
- 50个表结构
- 配置数据：
  - 1个比赛（第一届鸡王争霸赛）
  - 33个成就、16个任务
  - 15个抽奖奖品、18个扭蛋奖品
  - 8个积分兑换商品、30个API Key兑换码
  - 2条系统公告
- 示例数据：
  - 1个用户（枫枫 北）
  - 1个报名项目（API Key Tool - 令牌查询工具）

**部署流程**：
1. Webhook 触发部署
2. 检测数据库是否为空
3. 如果为空 → 导入 `production_clean_db.sql`
4. 执行增量迁移（`001_*.sql`, `002_*.sql`...）
5. 重启服务
6. 发送微信通知

**相关文件**：
- `backend/sql/production_clean_db.sql` - 初始数据库（新增）
- `backend/sql/README.md` - 数据库文档（新增）
- `deploy/webhook/deploy.sh:185-229` - 自动初始化逻辑
- `deploy/webhook/README.md:118-132` - 更新说明
- `deploy/webhook/MIGRATIONS.md:7-17` - 更新说明

---

### 📁 文件变更统计

**新增文件**：
- `backend/sql/production_clean_db.sql` (166KB)
- `backend/sql/README.md`

**修改文件**：
- `backend/app/services/github_service.py`
- `backend/app/api/v1/endpoints/github.py`
- `backend/app/api/v1/endpoints/registration.py`
- `backend/.env`
- `frontend/src/components/participant/ParticipantDetailModal.jsx`
- `deploy/webhook/deploy.sh`
- `deploy/webhook/README.md`
- `deploy/webhook/MIGRATIONS.md`

---

### 🚀 部署说明

#### 本地测试

```bash
# 1. 重建数据库
mysql -u root -proot -e "DROP DATABASE IF EXISTS chicken_king; CREATE DATABASE chicken_king CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 导入初始数据
mysql -u root -proot chicken_king < backend/sql/production_clean_db.sql

# 3. 验证数据
mysql -u root -proot chicken_king -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM registrations;"
```

#### 生产部署

```bash
# 推送到 GitHub，webhook 会自动部署
git add .
git commit -m "feat: 数据库自动初始化 & GitHub 同步优化"
git push origin main
```

Webhook 会自动：
1. 拉取代码
2. 生成 `.env` 配置
3. 重启容器
4. **自动导入 `production_clean_db.sql`**（如果数据库为空）
5. 执行迁移
6. 健康检查
7. 发送微信通知

---

### ⚠️ 注意事项

1. **GitHub Token**：确保在服务器 `backend/.env` 中配置了 `GITHUB_TOKEN`
2. **API Key**：示例报名中的 API Key 仅用于演示，生产环境需要真实的 ikuncode API Key
3. **数据清理**：已清理所有测试数据，只保留 1 个示例报名
4. **兼容性**：Webhook 脚本支持回退到旧方式（`schema.sql` + `seed_production_config.sql`）

---

### 🐛 已知问题

无

---

### 📚 相关文档

- [数据库初始化说明](backend/sql/README.md)
- [Webhook 部署文档](deploy/webhook/README.md)
- [数据库迁移文档](deploy/webhook/MIGRATIONS.md)
