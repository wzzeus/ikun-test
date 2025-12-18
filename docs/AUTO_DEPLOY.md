# 自动部署配置文档

## 概述

本项目已配置 GitHub Webhook 自动部署功能。当你 `git push` 到 `main` 分支时，服务器会自动拉取最新代码并重新部署所有服务。

## 架构图

```
┌─────────────┐     push      ┌─────────────┐
│   本地开发   │ ───────────▶ │   GitHub    │
└─────────────┘               └──────┬──────┘
                                     │ webhook
                                     ▼
┌────────────────────────────────────────────────────────┐
│                    服务器 (Ubuntu)                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Docker 容器                          │  │
│  │                                                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │  nginx   │  │ backend  │  │ frontend │       │  │
│  │  │  :80/443 │  │  :8000   │  │  :5174   │       │  │
│  │  └────┬─────┘  └──────────┘  └──────────┘       │  │
│  │       │                                          │  │
│  │  ┌────┴─────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ webhook  │  │   mysql  │  │  redis   │       │  │
│  │  │  :9000   │  │  :3306   │  │  :6379   │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘       │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## 工作流程

1. **开发者推送代码** → `git push origin main`
2. **GitHub 发送 Webhook** → `POST https://pk.ikuncode.cc/webhook`
3. **Webhook 服务验证签名** → 使用 HMAC-SHA256 验证请求来源
4. **执行部署脚本** → `/opt/chicken-king/deploy/webhook/deploy.sh`
5. **拉取最新代码** → `git fetch && git reset --hard origin/main`
6. **重建 Docker 容器** → `docker compose build && docker compose up -d`
7. **健康检查** → 等待后端服务启动并验证
8. **清理旧镜像** → `docker image prune -f`

## 目录结构

```
/opt/chicken-king/
├── docker-compose.yml          # 主项目容器编排（含 nginx）
├── backend/                    # FastAPI 后端
├── frontend/                   # React 前端
├── nginx/
│   ├── nginx.prod.conf         # Nginx 生产配置
│   ├── ssl/                    # SSL 证书
│   └── logs/                   # Nginx 日志
└── deploy/
    └── webhook/
        ├── app.py              # Webhook Flask 服务
        ├── deploy.sh           # 部署脚本
        ├── Dockerfile          # Webhook 容器镜像
        ├── docker-compose.yml  # Webhook 容器编排
        ├── .env                # Webhook 密钥配置
        └── logs/
            ├── webhook.log     # Webhook 服务日志
            └── deploy.log      # 部署执行日志
```

## 配置详情

### 1. GitHub Webhook 配置

| 配置项 | 值 |
|--------|-----|
| Payload URL | `https://pk.ikuncode.cc/webhook` |
| Content type | `application/json` |
| Secret | （存储在服务器 `.env` 文件中） |
| Events | Just the push event |
| Active | ✅ |

### 2. 服务器环境变量

**Webhook 服务** (`/opt/chicken-king/deploy/webhook/.env`):
```bash
WEBHOOK_SECRET=your-64-character-hex-secret
```

### 3. Docker 网络

| 网络名称 | 用途 |
|----------|------|
| `chicken-king_default` | 主项目容器通信 |
| `chicken-king_chicken_king_network` | Webhook 容器连接 |

Nginx 容器同时连接两个网络，以便能访问所有服务。

## 常用运维命令

### 查看服务状态

```bash
# 所有容器状态
docker ps

# 主项目容器
cd /opt/chicken-king && docker compose ps
```

### 查看日志

```bash
# Webhook 服务日志
docker logs chicken-king-webhook -f

# 部署执行日志
tail -f /opt/chicken-king/deploy/webhook/logs/deploy.log

# Nginx 日志
tail -f /opt/chicken-king/nginx/logs/access.log
tail -f /opt/chicken-king/nginx/logs/error.log

# 后端日志
docker logs chicken_king_backend -f

# 前端日志
docker logs chicken_king_frontend -f
```

### 手动部署

```bash
cd /opt/chicken-king

# 拉取最新代码
git pull

# 重建并启动所有服务
docker compose up -d --build

# 或只重启某个服务
docker compose restart backend
docker compose restart frontend
docker compose restart nginx
```

### 重启 Webhook 服务

```bash
cd /opt/chicken-king/deploy/webhook
docker compose restart
```

## 故障排查

### 1. 502 Bad Gateway

**可能原因**：
- 后端/前端容器未启动
- Nginx 未连接到正确的 Docker 网络

**解决方案**：
```bash
# 检查容器状态
docker ps

# 重启所有服务
cd /opt/chicken-king && docker compose up -d

# 检查 nginx 日志
docker logs chicken_king_nginx --tail 20
```

### 2. Webhook 返回 403

**可能原因**：
- GitHub Secret 与服务器不一致
- Content-Type 不是 `application/json`

**解决方案**：
```bash
# 查看服务器配置的密钥
cat /opt/chicken-king/deploy/webhook/.env

# 确保 GitHub Webhook 配置使用相同密钥
# Content-Type 必须是 application/json
```

### 3. 部署后网站无法访问

**可能原因**：
- Nginx 与其他容器不在同一网络
- 容器正在重启中

**解决方案**：
```bash
# 检查网络连接
docker network inspect chicken-king_default | grep nginx

# 如果 nginx 不在网络中，重新连接
docker network connect chicken-king_default chicken_king_nginx
docker restart chicken_king_nginx
```

### 4. Vite "Host not allowed" 错误

**原因**：前端使用开发模式，域名未在 allowedHosts 中

**解决方案**：
已在 `frontend/vite.config.js` 中配置：
```js
server: {
  allowedHosts: ['pk.ikuncode.cc', 'localhost'],
}
```

### 5. 部署脚本找不到 docker compose

**原因**：Webhook 容器内 Docker 版本问题

**解决方案**：
部署脚本已配置自动检测：
```bash
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi
```

## 安全注意事项

1. **Webhook Secret**：使用 64 字符的随机十六进制字符串
   ```bash
   openssl rand -hex 32
   ```

2. **签名验证**：所有 Webhook 请求都会验证 `X-Hub-Signature-256` 头

3. **SSL 证书**：通过 Cloudflare 提供 HTTPS

4. **Docker Socket**：Webhook 容器挂载了 Docker socket，仅用于执行部署命令

## 更新 Webhook Secret

如需更换密钥：

```bash
# 1. 生成新密钥
NEW_SECRET=$(openssl rand -hex 32)
echo "新密钥: $NEW_SECRET"

# 2. 更新服务器配置
echo "WEBHOOK_SECRET=$NEW_SECRET" > /opt/chicken-king/deploy/webhook/.env

# 3. 重启 webhook 服务
cd /opt/chicken-king/deploy/webhook && docker compose up -d

# 4. 更新 GitHub Webhook 配置
# 访问 https://github.com/deijing/ikun/settings/hooks
# 编辑 webhook，更新 Secret 字段
```

## 部署时间

| 阶段 | 预计时间 |
|------|----------|
| Git 拉取 | 2-5 秒 |
| Docker 构建 | 30-120 秒 |
| 容器启动 | 10-30 秒 |
| 健康检查 | 5-60 秒 |
| **总计** | **1-3 分钟** |

部署期间网站可能短暂不可用（约 10-30 秒），这是正常现象。

## 相关文件

- `deploy/webhook/app.py` - Webhook 接收服务
- `deploy/webhook/deploy.sh` - 部署执行脚本
- `deploy/webhook/Dockerfile` - Webhook 容器镜像
- `deploy/webhook/docker-compose.yml` - Webhook 容器编排
- `docker-compose.yml` - 主项目容器编排
- `nginx/nginx.prod.conf` - Nginx 反向代理配置
- `frontend/vite.config.js` - 前端 Vite 配置
