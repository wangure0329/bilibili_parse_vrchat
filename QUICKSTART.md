# 🚀 快速開始指南

## 5 分鐘快速部署

### 1. 準備環境

```bash
# 確保已安裝 Docker 和 Docker Compose
docker --version
docker-compose --version
```

### 2. 獲取代碼

```bash
git clone https://github.com/your-username/vrc-bilibili-parser.git
cd vrc-bilibili-parser
```

### 3. 設置環境變數

```bash
cp env.example .env
# 編輯 .env 文件，設置 Cloudflare Tunnel Token
```

### 4. 一鍵部署

```bash
# Linux/macOS
./deploy.sh

# Windows
deploy.bat
```

### 5. 訪問服務

- **應用程式**: http://localhost:3000
- **Portainer**: http://localhost:9000
- **正式網址**: https://vrcbilibili.xn--o8z.tw/

## 🔧 設置 Cloudflare Tunnel

1. 安裝 cloudflared
2. 登入 Cloudflare
3. 創建 Tunnel
4. 配置 DNS 記錄
5. 獲取 Token 並設置到 `.env`

詳細步驟請參考 [cloudflare-tunnel-setup.md](cloudflare-tunnel-setup.md)

## 📊 監控

使用 Portainer 管理 Docker 容器：
- 訪問 http://localhost:9000
- 創建管理員帳戶
- 監控容器狀態和日誌

## 🔄 更新

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

## ❓ 需要幫助？

查看 [DEPLOYMENT.md](DEPLOYMENT.md) 獲取詳細部署指南。
