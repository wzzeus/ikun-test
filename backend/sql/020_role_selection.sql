-- 020_role_selection.sql
-- 用户角色选择引导功能
-- 添加 role_selected 字段追踪用户是否已完成角色选择引导
-- 现有用户回填为 TRUE，避免打扰存量用户

-- 1. 添加 role_selected 字段
ALTER TABLE users
  ADD COLUMN role_selected BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. 添加 role_selected_at 字段（记录选择时间，用于审计）
ALTER TABLE users
  ADD COLUMN role_selected_at DATETIME NULL;

-- 3. 回填现有用户：全部标记为已选择，不打扰存量用户
-- 注意：role_selected_at 保持 NULL，表示这是系统迁移而非用户主动选择
UPDATE users
  SET role_selected = TRUE
  WHERE role_selected = FALSE;

-- 4. 为新字段添加索引（用于查询未完成引导的用户）
CREATE INDEX idx_users_role_selected ON users(role_selected);
