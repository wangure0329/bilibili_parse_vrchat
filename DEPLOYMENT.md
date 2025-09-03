# VRC Bilibili 解析工具 - 完整部署指南

## 📋 部署前準備

### 系統要求

- **作業系統**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **記憶體**: 最少 2GB RAM
- **硬碟**: 最少 10GB 可用空間

### 必要軟體安裝

#### Ubuntu/Debian

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安裝 Git
sudo apt install git -y
```

#### CentOS/RHEL

```bash
# 安裝 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安裝 Git
sudo yum install git -y
```

## 🚀 部署步驟

### 1. 獲取代碼

```bash
# 克隆倉庫
git clone https://github.com/your-username/vrc-bilibili-parser.git
cd vrc-bilibili-parser
```

### 2. 設置環境變數

```bash
# 複製環境變數模板
cp env.example .env

# 編輯環境變數文件
nano .env
```

在 `.env` 文件中設置：

```env
# Cloudflare Tunnel 配置
CLOUDFLARE_TUNNEL_TOKEN=your_cloudflare_tunnel_token_here

# 應用程式配置
NODE_ENV=production
PORT=3000

# 域名配置
DOMAIN=vrcbilibili.xn--o8z.tw
```

### 3. 設置 Cloudflare Tunnel

詳細步驟請參考 [cloudflare-tunnel-setup.md](cloudflare-tunnel-setup.md)

### 4. 部署應用程式

```bash
# 使用部署腳本（推薦）
./deploy.sh

# 或手動部署
docker-compose up -d --build
```

### 5. 驗證部署

```bash
# 檢查容器狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 測試應用程式
curl http://localhost:3000
```

## 📊 監控和管理

### Portainer 管理界面

1. 訪問 http://your-server-ip:9000
2. 創建管理員帳戶
3. 管理 Docker 容器和服務

### 日誌管理

```bash
# 查看應用程式日誌
docker-compose logs -f bilibili-parser

# 查看所有服務日誌
docker-compose logs -f

# 查看特定時間的日誌
docker-compose logs --since="2024-01-01T00:00:00" bilibili-parser
```

### 備份和恢復

```bash
# 備份數據
docker-compose exec portainer tar -czf /data/backup.tar.gz /data

# 恢復數據
docker-compose exec portainer tar -xzf /data/backup.tar.gz -C /
```

## 🔄 更新和維護

### 更新應用程式

```bash
# 拉取最新代碼
git pull origin main

# 重新構建和部署
docker-compose down
docker-compose up -d --build
```

### 清理系統

```bash
# 清理未使用的 Docker 資源
docker system prune -a

# 清理未使用的卷
docker volume prune
```

## 🛠️ 故障排除

### 常見問題

1. **容器無法啟動**
   ```bash
   # 檢查日誌
   docker-compose logs
   
   # 檢查端口占用
   netstat -tulpn | grep :3000
   ```

2. **Cloudflare Tunnel 連接失敗**
   ```bash
   # 檢查 Token 是否正確
   echo $CLOUDFLARE_TUNNEL_TOKEN
   
   # 測試 Tunnel 連接
   cloudflared tunnel run --token $CLOUDFLARE_TUNNEL_TOKEN
   ```

3. **Portainer 無法訪問**
   ```bash
   # 檢查 Portainer 容器狀態
   docker-compose ps portainer
   
   # 重啟 Portainer
   docker-compose restart portainer
   ```

### 性能優化

1. **增加記憶體限制**
   ```yaml
   # 在 docker-compose.yml 中添加
   deploy:
     resources:
       limits:
         memory: 1G
   ```

2. **啟用日誌輪轉**
   ```yaml
   # 在 docker-compose.yml 中添加
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

## 📞 支援

如果遇到問題，請：

1. 檢查 [故障排除](#故障排除) 部分
2. 查看 GitHub Issues
3. 聯繫技術支援：wangure0329@糕.tw

## 🔒 安全建議

1. **定期更新系統和 Docker**
2. **使用強密碼**
3. **限制 Portainer 訪問**
4. **定期備份數據**
5. **監控日誌文件**
