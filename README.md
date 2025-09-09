# VRC Bilibili 解析工具

一個功能強大的 Bilibili 影片解析網站，可以快速獲取 Bilibili 影片的直鏈地址。

🌐 **官方網址**: https://vrcbilibili.xn--o8z.tw/

## 功能特點

- 🎥 **影片解析**：支援 Bilibili 影片的直鏈解析，獲取 1440P (2K) 超高清影片地址
- 📋 **一鍵複製**：解析結果自動複製到剪貼簿，方便使用
- 🔒 **安全可靠**：不儲存任何使用者資料，保護隱私安全
- 🎨 **現代化 UI**：美觀的深色主題界面，支援響應式設計
- ⚡ **快速解析**：使用智能節點選擇，確保解析成功率
- 🌍 **多語言支援**：支援繁體中文、簡體中文、日文
- 📊 **服務統計**：實時顯示今日、本月、累計服務次數
- 🎯 **專用節點**：中文咖啡廳專用解析節點，適配特殊需求
- 🔄 **多種解析方式**：支援智能選擇、專用節點、直接重定向三種模式

## 使用方法

### 基本使用

1. 在輸入框中貼上 Bilibili 影片連結
2. 點擊「解析」按鈕或按 Enter 鍵
3. 等待解析完成，結果會自動複製到剪貼簿
4. 點擊「複製」按鈕可複製特定連結

### URL 參數支援

網站支援多種 URL 參數直接解析：

#### 智能選擇解析
```
https://vrcbilibili.xn--o8z.tw/?url=https://www.bilibili.com/video/BV1xx411c7mu
```

#### 中文咖啡廳專用解析
```
https://vrcbilibili.xn--o8z.tw/niche/?url=https://www.bilibili.com/video/BV1xx411c7mu
```

### 支援的連結格式

- 影片連結：
  - `https://www.bilibili.com/video/BV1xx411c7mu`
  - `https://www.bilibili.com/video/BV1xx411c7mu?p=1`
  - `https://www.bilibili.com/bangumi/play/ss12345`
  - `bilibili.com/video/BV1xx411c7mu` （自動添加 https://）
  - `www.bilibili.com/video/BV1xx411c7mu` （自動添加 https://）

## 技術特性

- **智能節點選擇**：基於成功率的智能節點選擇算法
- **多 CDN 支援**：支援深圳、北京、杭州三個主要 CDN 節點
- **自動節點替換**：所有 CDN 節點自動替換為最佳節點
- **解析時間監控**：詳細記錄解析耗時和性能數據
- **超時重試機制**：10秒超時自動重試，最多3次嘗試
- **地理位置識別**：自動識別請求者國家和地區
- **URL 清理**：自動清理 Bilibili URL 中的追蹤參數
- **錯誤處理**：完善的錯誤處理和用戶反饋
- **響應式設計**：支援桌面和移動設備
- **鍵盤快捷鍵**：支援 Ctrl+Enter 快速解析
- **服務計數器**：實時統計服務使用情況
- **多語言界面**：支援繁體中文、簡體中文、日文切換

## 文件結構

```
├── index.html          # 主頁面
├── style.css           # 樣式文件
├── script.js           # JavaScript 功能
├── server.js           # Node.js 後端服務器
├── package.json        # 依賴配置
├── docker-compose.yml  # Docker 配置
├── Dockerfile          # Docker 映像配置
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

## 技術架構

### 🏗️ 系統架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │   Node.js 後端  │    │   Bilibili API  │
│                 │    │                 │    │                 │
│ • 多語言支援    │◄──►│ • 智能節點選擇  │◄──►│ • 影片資訊 API  │
│ • 響應式設計    │    │ • CDN 節點替換  │    │ • 流地址 API    │
│ • 服務統計顯示  │    │ • 解析重試機制  │    │ • 地理位置 API  │
│ • 一鍵複製功能  │    │ • 日誌監控系統  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔧 核心組件

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **後端**: Node.js + Express.js
- **依賴管理**: npm + package.json
- **容器化**: Docker + Docker Compose
- **CDN 管理**: 智能節點選擇算法
- **日誌系統**: 詳細的請求追蹤和監控

## 重要技術說明

### 🎯 智能節點管理

本工具採用**多層節點選擇策略**，提供三種不同的解析模式：

#### 智能選擇節點（9個主要節點）
- **深圳節點 (華南)**:
  - `upos-sz-estgoss.bilivideo.com` - GOSS 節點
  - `upos-sz-estgcos.bilivideo.com` - GCOS 節點
  - `upos-sz-estghw.bilivideo.com` - GHW 節點

- **北京節點 (華北)**:
  - `upos-bj-estgoss.bilivideo.com` - GOSS 節點
  - `upos-bj-estgcos.bilivideo.com` - GCOS 節點
  - `upos-bj-estghw.bilivideo.com` - GHW 節點

- **杭州節點 (華東)**:
  - `upos-hz-estgoss.bilivideo.com` - GOSS 節點
  - `upos-hz-estgcos.bilivideo.com` - GCOS 節點
  - `upos-hz-estghw.bilivideo.com` - GHW 節點

#### 專用節點
- **中文咖啡廳節點**:
  - `upos-sz-mirror08c.bilivideo.com` - Mirror 節點（專用，不參與智能選擇）

#### 節點選擇策略
- **智能選擇**: 根據歷史成功率從 9 個主要節點中自動選擇最穩定的節點
- **專用節點**: 中文咖啡廳欄位和 `/niche/` 路由強制使用 Mirror 節點
- **自動替換**: 所有其他 CDN 節點都會自動替換為選中的節點
- **成功率追蹤**: 實時追蹤每個節點的成功和失敗次數
- **支援節點格式**:
  - `upos-sz-*.bilivideo.com` → 選中的節點
  - `upos-bj-*.bilivideo.com` → 選中的節點
  - `upos-hz-*.bilivideo.com` → 選中的節點
  - `upos-*-*-*.akamaized.net` → 選中的節點
  - `upos-*-*-*.cloudfront.net` → 選中的節點

### 🔄 多種解析機制

#### 智能選擇解析 (`/?url=BILIBILI_URL`)
1. 系統會自動解析影片
2. 獲取 1440P (2K) 品質的流地址
3. 從 9 個主要節點中智能選擇最佳節點
4. 將所有 CDN 節點替換為選中的節點
5. 直接重定向到選中的節點地址

#### 中文咖啡廳專用解析 (`/niche/?url=BILIBILI_URL`)
1. 系統會自動解析影片
2. 獲取 1440P (2K) 品質的流地址
3. 強制使用 `upos-sz-mirror08c.bilivideo.com` 節點
4. 將所有 CDN 節點替換為 Mirror 節點
5. 直接重定向到 Mirror 節點地址

#### 前端專用欄位解析
1. 使用中文咖啡廳專用欄位輸入連結
2. 調用 `/api/parse/video/:bvid?mirror=true` API
3. 強制使用 `upos-sz-mirror08c.bilivideo.com` 節點
4. 顯示 "中文咖啡廳適配" 備註
5. 提供多種格式的流地址供選擇

### 📊 日誌監控

系統提供詳細的請求日誌，包含：
- **請求者 IP**: 支援多種 IP 獲取方式
- **地理位置**: 自動識別國家和地區
- **時間戳**: 台灣時間格式
- **解析時間**: 詳細記錄每次解析的耗時
- **節點資訊**: 顯示實際使用的 CDN 節點
- **重試記錄**: 記錄重試次數和失敗原因
- **瀏覽器資訊**: User-Agent 分析
- **語言設定**: Accept-Language 檢測
- **來源頁面**: Referer 追蹤
- **服務統計**: 實時顯示今日、本月、累計服務次數
- **節點成功率**: 追蹤每個節點的歷史成功率

### 🔌 API 端點

#### 影片解析
```
GET /api/parse/video/:bvid
```
- **參數**: `bvid` - Bilibili 影片 ID
- **返回**: JSON 格式的解析結果
- **功能**: 解析影片並返回 1440P 流地址

#### 服務統計
```
GET /api/counters
```
- **返回**: 今日、本月、累計服務次數
- **功能**: 獲取服務使用統計

#### 智能選擇重定向解析
```
GET /?url=BILIBILI_URL
```
- **參數**: `url` - Bilibili 影片連結
- **返回**: 直接重定向到解析後的流地址
- **功能**: 一鍵解析並重定向（使用智能節點選擇）

#### 中文咖啡廳專用重定向解析
```
GET /niche/?url=BILIBILI_URL
```
- **參數**: `url` - Bilibili 影片連結
- **返回**: 直接重定向到解析後的流地址
- **功能**: 一鍵解析並重定向（強制使用 Mirror 節點）

#### 專用節點 API 解析
```
GET /api/parse/video/:bvid?mirror=true
```
- **參數**: `bvid` - Bilibili 影片 ID，`mirror=true` - 使用 Mirror 節點
- **返回**: JSON 格式的解析結果
- **功能**: 解析影片並返回 1440P 流地址（顯示 "中文咖啡廳適配" 備註）

## 注意事項

- 本工具僅供學習交流使用
- 請尊重創作者的版權，不要濫用解析功能
- **品質限制**: 僅支援 1440P (2K) 解析，提供最高畫質
- **節點穩定性**: 使用智能節點選擇，從三個節點中自動選擇最穩定的節點
- **解析時間**: 平均解析時間約 300-500ms，超時會自動重試
- **地理位置**: 系統會記錄請求者的地理位置資訊
- **服務統計**: 系統會統計服務使用次數，用於監控和分析
- 部分影片可能受地區限制
- 解析 API 可能隨時變更，請以實際情況為準
- **本地測試**: 本地環境會顯示 `::1` IP，這是正常的
- **節點選擇**: 系統會從三個節點中根據歷史成功率自動選擇最佳節點

## 免責聲明

本工具僅用於學習研究，請勿用於非法用途。使用本工具產生的一切後果由使用者自行承擔。

## 更新日誌

### v1.7.0 (2025-01-15)
- **URL 格式支援**: 支援不帶協議的 Bilibili URL 解析（如 `bilibili.com/video/BV1xx411c7mu`）
- **解析結果優化**: 修復解析結果自動下載問題，改為顯示結果頁面
- **流地址處理**: 流地址只顯示縮短版本，避免觸發自動下載
- **播放功能**: 新增「播放」按鈕，在新標籤頁中播放流地址
- **用戶體驗改善**: 優化解析結果的顯示和操作方式

### v1.6.0 (2025-01-15)
- **專用節點支援**: 新增中文咖啡廳專用解析節點 `upos-sz-mirror08c.bilivideo.com`
- **多種解析模式**: 支援智能選擇、專用節點、直接重定向三種解析方式
- **前端專用欄位**: 新增中文咖啡廳專用輸入欄位，顯示 "中文咖啡廳適配" 備註
- **專用路由**: 新增 `/niche/?url=` 路由，強制使用 Mirror 節點
- **節點隔離**: Mirror 節點不參與智能選擇，僅作為專用節點使用
- **備註修復**: 修復專用節點解析結果的備註顯示問題

### v1.5.0 (2025-01-15)
- **移除直播功能**: 專注於影片解析，提高系統穩定性
- **智能節點選擇**: 基於歷史成功率的智能節點選擇算法
- **多語言支援**: 支援繁體中文、簡體中文、日文界面
- **服務統計**: 實時顯示今日、本月、累計服務次數
- **節點成功率追蹤**: 實時追蹤每個節點的歷史成功率

### v1.4.0 (2025-01-15)
- **隨機節點選擇**: 支援三個主節點隨機分配，提高可用性
- **解析時間記錄**: 詳細記錄每次解析的耗時和性能數據
- **超時重試機制**: 10秒超時自動重試，最多3次嘗試
- **地理位置顯示**: 顯示請求者的國家和地區資訊
- **節點負載分散**: 自動在三個節點間分散負載

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
- 支援影片解析
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
