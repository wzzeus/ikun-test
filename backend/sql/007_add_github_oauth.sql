-- 007: 添加 GitHub OAuth 登录支持
-- 为 users 表添加 GitHub 相关字段

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `github_id` VARCHAR(50) NULL AFTER `linux_do_avatar_template`,
  ADD COLUMN IF NOT EXISTS `github_username` VARCHAR(100) NULL AFTER `github_id`,
  ADD COLUMN IF NOT EXISTS `github_avatar_url` VARCHAR(500) NULL AFTER `github_username`,
  ADD COLUMN IF NOT EXISTS `github_email` VARCHAR(255) NULL AFTER `github_avatar_url`;

-- 添加唯一索引（幂等）
CREATE UNIQUE INDEX IF NOT EXISTS `uq_users_github_id` ON `users` (`github_id`);

-- 添加普通索引加速查询（幂等）
CREATE INDEX IF NOT EXISTS `idx_users_github_username` ON `users` (`github_username`);
