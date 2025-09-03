#!/bin/bash

# VRC Bilibili 解析工具部署腳本
echo "🚀 開始部署 VRC Bilibili 解析工具..."

# 檢查 Docker 是否安裝
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝，請先安裝 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安裝，請先安裝 Docker Compose"
    exit 1
fi

# 檢查環境變數文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，從 env.example 複製..."
    cp env.example .env
    echo "📝 請編輯 .env 文件並設置 Cloudflare Tunnel Token"
    echo "   然後重新運行此腳本"
    exit 1
fi

# 停止現有容器
echo "🛑 停止現有容器..."
docker-compose down

# 構建並啟動服務
echo "🔨 構建並啟動服務..."
docker-compose up -d --build

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 10

# 檢查服務狀態
echo "📊 檢查服務狀態..."
docker-compose ps

# 顯示日誌
echo "📋 顯示服務日誌..."
docker-compose logs --tail=20

echo "✅ 部署完成！"
echo "🌐 應用程式: http://localhost:3000"
echo "📊 Portainer: http://localhost:9000"
echo "🌍 正式網址: https://vrcbilibili.xn--o8z.tw/"
