# Cloudflare Tunnel 設置指南

## 1. 安裝 Cloudflare Tunnel

### 在您的伺服器上安裝 cloudflared

```bash
# Ubuntu/Debian
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# CentOS/RHEL
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.rpm
sudo rpm -i cloudflared-linux-amd64.rpm
```

## 2. 登入 Cloudflare

```bash
cloudflared tunnel login
```

這會打開瀏覽器讓您登入 Cloudflare 帳戶。

## 3. 創建 Tunnel

```bash
cloudflared tunnel create vrc-bilibili-parser
```

記下返回的 Tunnel ID。

## 4. 配置 Tunnel

創建配置文件 `/root/.cloudflared/config.yml`：

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: vrcbilibili.xn--o8z.tw
    service: http://localhost:3000
  - hostname: portainer.vrcbilibili.xn--o8z.tw
    service: http://localhost:9000
  - service: http_status:404
```

## 5. 設置 DNS 記錄

```bash
cloudflared tunnel route dns vrc-bilibili-parser vrcbilibili.xn--o8z.tw
cloudflared tunnel route dns vrc-bilibili-parser portainer.vrcbilibili.xn--o8z.tw
```

## 6. 獲取 Tunnel Token

```bash
cloudflared tunnel token YOUR_TUNNEL_ID
```

複製返回的 token 並設置到 `.env` 文件中：

```
CLOUDFLARE_TUNNEL_TOKEN=your_token_here
```

## 7. 測試 Tunnel

```bash
cloudflared tunnel run vrc-bilibili-parser
```

## 8. 設置為系統服務（可選）

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## 注意事項

- 確保您的域名已在 Cloudflare 中設置
- Tunnel 會自動處理 SSL 證書
- 可以通過 Cloudflare Dashboard 監控 Tunnel 狀態
