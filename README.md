# VRC Bilibili 解析工具

一個功能強大的 Bilibili 影片和直播解析網站，可以快速獲取 Bilibili 影片和直播的直鏈地址。

🌐 **官方網址**: https://vrcbilibili.xn--o8z.tw/

## 功能特點

- 🎥 **影片解析**：支援 Bilibili 影片的直鏈解析，獲取高清影片地址
- 📺 **直播解析**：支援 Bilibili 直播流解析，獲取 M3U8 和 FLV 格式
- 📋 **一鍵複製**：解析結果自動複製到剪貼簿，方便使用
- 🔒 **安全可靠**：不儲存任何使用者資料，保護隱私安全
- 🎨 **現代化 UI**：美觀的深色主題界面，支援響應式設計
- ⚡ **快速解析**：使用多個解析 API，確保解析成功率

## 使用方法

### 基本使用

1. 在輸入框中貼上 Bilibili 影片或直播連結
2. 點擊「解析」按鈕或按 Enter 鍵
3. 等待解析完成，結果會自動複製到剪貼簿
4. 點擊「複製」按鈕可複製特定連結

### URL 參數支援

網站支援 URL 參數直接解析：

```
https://vrcbilibili.xn--o8z.tw/?url=https://www.bilibili.com/video/BV1xx411c7mu
```

### 支援的連結格式

- 影片連結：
  - `https://www.bilibili.com/video/BV1xx411c7mu`
  - `https://www.bilibili.com/video/BV1xx411c7mu?p=1`
  - `https://www.bilibili.com/bangumi/play/ss12345`

- 直播連結：
  - `https://live.bilibili.com/123456`
  - `https://live.bilibili.com/123456?from=search`

## 技術特性

- **多 API 支援**：使用多個解析 API 確保成功率
- **智能回退**：當一個 API 失敗時自動嘗試其他 API
- **URL 清理**：自動清理 Bilibili URL 中的追蹤參數
- **錯誤處理**：完善的錯誤處理和用戶反饋
- **響應式設計**：支援桌面和移動設備
- **鍵盤快捷鍵**：支援 Ctrl+Enter 快速解析

## 文件結構

```
├── index.html          # 主頁面
├── style.css           # 樣式文件
├── script.js           # JavaScript 功能
└── README.md           # 說明文件
```

## 部署方法

### 🐳 Docker 部署（推薦）

#### 快速部署

1. **克隆倉庫**
   ```bash
   git clone https://github.com/your-username/vrc-bilibili-parser.git
   cd vrc-bilibili-parser
   ```

2. **設置環境變數**
   ```bash
   cp env.example .env
   # 編輯 .env 文件，設置 Cloudflare Tunnel Token
   ```

3. **運行部署腳本**
   ```bash
   # Linux/macOS
   ./deploy.sh
   
   # Windows
   deploy.bat
   ```

#### 手動部署

1. **構建並啟動服務**
   ```bash
   docker-compose up -d --build
   ```

2. **檢查服務狀態**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

#### 服務訪問

- **應用程式**: http://localhost:3000
- **Portainer 管理**: http://localhost:9000
- **正式網址**: https://vrcbilibili.xn--o8z.tw/

### ☁️ Cloudflare Tunnel 設置

詳細的 Cloudflare Tunnel 設置請參考 [cloudflare-tunnel-setup.md](cloudflare-tunnel-setup.md)

### 📦 GitHub 部署流程

#### 推送到 GitHub

1. **初始化 Git 倉庫**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **添加遠程倉庫**
   ```bash
   git remote add origin https://github.com/your-username/vrc-bilibili-parser.git
   git push -u origin main
   ```

#### 在伺服器上拉取

1. **克隆倉庫**
   ```bash
   git clone https://github.com/your-username/vrc-bilibili-parser.git
   cd vrc-bilibili-parser
   ```

2. **設置環境變數**
   ```bash
   cp env.example .env
   # 編輯 .env 文件
   ```

3. **部署**
   ```bash
   ./deploy.sh
   ```

### 🔄 更新部署

```bash
# 拉取最新代碼
git pull origin main

# 重新部署
docker-compose down
docker-compose up -d --build
```

## 瀏覽器支援

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 注意事項

- 本工具僅供學習交流使用
- 請尊重創作者的版權，不要濫用解析功能
- 部分高清影片需要登入 Bilibili 帳號才能解析
- 部分影片可能受地區限制
- 解析 API 可能隨時變更，請以實際情況為準

## 免責聲明

本工具僅用於學習研究，請勿用於非法用途。使用本工具產生的一切後果由使用者自行承擔。

## 更新日誌

### v1.0.0
- 初始版本發布
- 支援影片和直播解析
- 現代化 UI 設計
- 響應式佈局
- 多 API 支援

## 貢獻

歡迎提交 Issue 和 Pull Request 來改進這個項目。

## 📞 技術支援

如果遇到問題或需要協助，請聯繫：

**Email**: wangure0329@糕.tw

我們會盡快回覆您的問題。

## 授權

MIT License

## 致謝

- 感謝 [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) 提供的 Bilibili API 參考
- 感謝 [mmyo456/BiliBili-JX](https://github.com/mmyo456/BiliBili-JX) 提供的代碼參考
