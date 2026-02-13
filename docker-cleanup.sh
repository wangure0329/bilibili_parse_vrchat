#!/bin/bash

# Docker 完全清理和重新部署腳本
# 使用方式: ./docker-cleanup.sh

echo "🧹 開始清理 Docker 環境..."

# 1. 停止所有容器
echo "1️⃣ 停止所有容器..."
docker-compose down

# 2. 移除所有相關容器（包括未在 docker-compose 中的）
echo "2️⃣ 移除所有相關容器..."
docker ps -a | grep -E "bilibili|portainer|cloudflared" | awk '{print $1}' | xargs -r docker rm -f

# 3. 移除所有相關映像
echo "3️⃣ 移除所有相關映像..."
docker images | grep -E "bilibili_parse_vrchat|portainer|cloudflared" | awk '{print $3}' | xargs -r docker rmi -f

# 4. 清理未使用的資源
echo "4️⃣ 清理未使用的資源..."
docker system prune -f

# 5. 清理未使用的卷（可選，謹慎使用）
# echo "5️⃣ 清理未使用的卷..."
# docker volume prune -f

echo "✅ 清理完成！"
echo ""
echo "🚀 開始重新部署..."
echo ""

# 6. 重新構建並啟動
docker-compose up -d --build --force-recreate

echo ""
echo "📊 檢查服務狀態..."
docker-compose ps

echo ""
echo "📋 查看日誌（按 Ctrl+C 退出）..."
docker-compose logs -f
