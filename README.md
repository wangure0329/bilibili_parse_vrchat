# VRC Bilibili 解析工具

一個功能強大的 Bilibili 影片和直播解析網站，可以快速獲取 Bilibili 影片和直播的直鏈地址。

🌐 **官方網址**: https://vrcbilibili.xn--o8z.tw/

## 功能特點

- 🎥 **影片解析**：支援 Bilibili 影片的直鏈解析，獲取 1440P (2K) 超高清影片地址
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

## 重要技術說明

### 🎯 CDN 節點管理

本工具採用**統一主節點策略**，所有解析結果都會自動重定向到 Bilibili 的主 CDN 節點：

- **主節點**: `upos-sz-estgoss.bilivideo.com`
- **自動替換**: 所有其他 CDN 節點都會自動替換為主節點
- **支援節點格式**:
  - `upos-sz-*.bilivideo.com` → 主節點
  - `upos-hz-*.akamaized.net` → 主節點
  - `upos-*-*-*.bilivideo.com` → 主節點
  - `upos-*-*-*.akamaized.net` → 主節點
  - `upos-*-*-*.cloudfront.net` → 主節點

### 🔄 自動重定向機制

當使用 `/?url=BILIBILI_URL` 格式時：
1. 系統會自動解析影片
2. 獲取 720P 品質的流地址
3. 將所有 CDN 節點替換為主節點
4. 直接重定向到主節點地址

### 📊 日誌監控

系統提供詳細的請求日誌，包含：
- **請求者 IP**: 支援多種 IP 獲取方式
- **時間戳**: 台灣時間格式
- **瀏覽器資訊**: User-Agent 分析
- **語言設定**: Accept-Language 檢測
- **來源頁面**: Referer 追蹤

## 注意事項

- 本工具僅供學習交流使用
- 請尊重創作者的版權，不要濫用解析功能
- **品質限制**: 僅支援 1440P (2K) 解析，提供最高畫質
- **節點穩定性**: 使用統一主節點確保穩定性
- 部分影片可能受地區限制
- 解析 API 可能隨時變更，請以實際情況為準
- **本地測試**: 本地環境會顯示 `::1` IP，這是正常的

## 免責聲明

本工具僅用於學習研究，請勿用於非法用途。使用本工具產生的一切後果由使用者自行承擔。

## 更新日誌

### v1.3.0 (2025-01-15)
- **品質升級**: 從 720P 升級至 1440P (2K) 解析
- **日誌優化**: 添加品質顯示，清楚顯示解析的影片品質
- **函數重構**: 更新函數名稱和相關邏輯以支援 1440P
- **API 優化**: 使用 qn=112 參數獲取 2K 超高清品質

### v1.2.0 (2025-01-15)
- **優化日誌格式**: 添加詳細請求者資訊和 IP 調試
- **統一 CDN 節點**: 所有解析結果自動重定向到主節點
- **IP 獲取優化**: 支援多種 IP 獲取方式，包括代理環境
- **日誌監控**: 提供完整的請求追蹤和監控功能

### v1.1.0
- 添加 Cloudflare Tunnel 支援
- 優化 Docker 部署流程
- 改進錯誤處理機制
- 添加 Portainer 管理支援

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

---

**by りん** | **X: [@wangure0329](https://x.com/wangure0329)**

## 授權

MIT License

## 致謝

- 感謝 [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) 提供的 Bilibili API 參考
