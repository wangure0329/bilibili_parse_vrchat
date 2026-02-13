# Docker 完全清理和重新部署指南

## 🔍 檢查當前狀態

```bash
# 查看所有容器
docker ps -a

# 查看所有映像
docker images

# 查看 docker-compose 服務狀態
docker-compose ps
```

## 🧹 完全清理步驟

### 方法一：使用清理腳本（推薦）

```bash
# 給腳本執行權限
chmod +x docker-cleanup.sh

# 執行清理和重新部署
./docker-cleanup.sh
```

### 方法二：手動清理

```bash
# 1. 停止並移除所有容器
docker-compose down

# 2. 移除所有相關容器（包括未在 docker-compose 中的）
docker ps -a | grep -E "bilibili|portainer|cloudflared" | awk '{print $1}' | xargs -r docker rm -f

# 3. 移除所有相關映像
docker images | grep -E "bilibili_parse_vrchat|portainer|cloudflared" | awk '{print $3}' | xargs -r docker rmi -f

# 4. 清理未使用的資源（包括網路、緩存等）
docker system prune -f

# 5. （可選）清理未使用的卷（謹慎使用，會刪除數據）
# docker volume prune -f
```

## 🚀 重新部署步驟

```bash
# 1. 確保在正確的目錄
cd /home/wangure0329/bilibili_parse_vrchat

# 2. 拉取最新代碼
git pull

# 3. 重新構建並啟動（強制重新創建）
docker-compose up -d --build --force-recreate

# 4. 查看服務狀態
docker-compose ps

# 5. 查看日誌
docker-compose logs -f bilibili-parser
```

## ✅ 驗證部署

```bash
# 檢查容器是否運行
docker ps

# 檢查端口是否監聽
netstat -tuln | grep 3000

# 測試服務是否響應
curl http://localhost:3000
```

## 🔧 常見問題

### 如果端口被佔用

```bash
# 查找佔用端口的進程
lsof -i :3000
# 或
netstat -tuln | grep 3000

# 停止佔用的進程
kill -9 <PID>
```

### 如果映像構建失敗

```bash
# 清理構建緩存
docker builder prune -f

# 重新構建（不使用緩存）
docker-compose build --no-cache
docker-compose up -d
```

### 如果容器無法啟動

```bash
# 查看詳細日誌
docker-compose logs bilibili-parser

# 檢查容器狀態
docker inspect vrc-bilibili-parser
```

## 📋 完整清理和部署命令（一行）

```bash
cd /home/wangure0329/bilibili_parse_vrchat && \
git pull && \
docker-compose down && \
docker ps -a | grep -E "bilibili|portainer|cloudflared" | awk '{print $1}' | xargs -r docker rm -f && \
docker images | grep -E "bilibili_parse_vrchat|portainer|cloudflared" | awk '{print $3}' | xargs -r docker rmi -f && \
docker system prune -f && \
docker-compose up -d --build --force-recreate && \
docker-compose ps
```
