// Bilibili 解析工具 JavaScript

// 簡化計數器系統
let stats = { total: 0, today: 0, thisMonth: 0 };

// 加載統計數據
async function loadStats() {
    try {
        const response = await fetch('/api/counters');
        const result = await response.json();
        
        if (result.success) {
            stats = result.data;
            updateStats();
        }
    } catch (error) {
        console.log('統計數據加載失敗，使用默認值');
        updateStats();
    }
}

// 更新統計顯示
function updateStats() {
    const elements = {
        today: document.getElementById('todayCount'),
        month: document.getElementById('monthCount'),
        total: document.getElementById('totalCount')
    };
    
    if (elements.today) elements.today.textContent = stats.today || 0;
    if (elements.month) elements.month.textContent = stats.thisMonth || 0;
    if (elements.total) elements.total.textContent = stats.total || 0;
}


// 語言切換功能
const translations = {
    zh: {
        'loading': '解析中...',
        'error': '解析失敗',
        'success': '解析成功',
        'copy': '複製',
        'copied': '已複製',
        'copyAll': '複製全部',
        'quality': '清晰度',
        'format': '格式',
        'size': '大小',
        'duration': '時長',
        'video': '影片',
        'noResults': '沒有找到解析結果',
        'invalidUrl': '請輸入有效的 Bilibili 連結',
        'networkError': '網路錯誤，請稍後重試',
        'features': '功能特點',
        'fastParse': '快速解析',
        'multiQuality': '多清晰度',
        'directLink': '直鏈獲取',
        'noLogin': '無需登入',
        'supportVideo': '支援影片',
        'modernUI': '現代化界面',
        'responsive': '響應式設計',
        'example': '範例',
        'exampleVideo': '影片範例',
        'parseResult': '解析結果',
        'techSupport': '技術支援',
        'author': 'by りん',
        'socialMedia': 'X: @wangure0329'
    },
    ja: {
        'loading': '解析中...',
        'error': '解析失敗',
        'success': '解析成功',
        'copy': 'コピー',
        'copied': 'コピーしました',
        'copyAll': 'すべてコピー',
        'quality': '画質',
        'format': 'フォーマット',
        'size': 'サイズ',
        'duration': '時間',
        'video': '動画',
        'live': 'ライブ',
        'noResults': '解析結果が見つかりません',
        'invalidUrl': '有効なBilibiliリンクを入力してください',
        'networkError': 'ネットワークエラーです。しばらくしてから再試行してください',
        'features': '機能特徴',
        'fastParse': '高速解析',
        'multiQuality': '複数画質',
        'directLink': '直接リンク取得',
        'noLogin': 'ログイン不要',
        'supportVideo': '動画対応',
        'supportLive': 'ライブ対応',
        'modernUI': 'モダンUI',
        'responsive': 'レスポンシブデザイン',
        'example': '例',
        'exampleVideo': '動画例',
        'exampleLive': 'ライブ例',
        'parseResult': '解析結果',
        'techSupport': '技術サポート',
        'author': 'by りん',
        'socialMedia': 'X: @wangure0329'
    }
};

let currentLang = 'zh';

// 語言切換功能
function switchLanguage(lang) {
    currentLang = lang;
    
    // 更新語言按鈕狀態
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-lang="${lang}"]`).classList.add('active');
    
    // 更新所有帶有 data-zh 和 data-ja 屬性的元素
    document.querySelectorAll('[data-zh]').forEach(element => {
        const text = element.getAttribute(`data-${lang}`);
        if (text) {
            element.textContent = text;
        }
    });
    
    // 更新輸入框的 placeholder
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        const placeholder = urlInput.getAttribute(`data-${lang}-placeholder`);
        if (placeholder) {
            urlInput.placeholder = placeholder;
        }
    }
    
    // 保存語言偏好
    localStorage.setItem('preferredLanguage', lang);
}

class BilibiliParser {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.handleUrlParams();
    }

    init() {
        // 初始化變量
        this.isLoading = false;
        this.currentResults = [];
        
        // 創建提示框元素
        this.createToast();
        
        // 初始化語言
        const savedLang = localStorage.getItem('preferredLanguage') || 'zh';
        switchLanguage(savedLang);
        
        // 語言切換事件
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                switchLanguage(lang);
            });
        });
        
        // 檢查 URL 參數
        this.handleUrlParams();
    }

    setupEventListeners() {
        // 解析按鈕點擊事件
        const parseBtn = document.getElementById('parseBtn');
        if (parseBtn) {
            parseBtn.addEventListener('click', () => this.handleParse());
        }

        // 輸入框回車事件
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleParse();
                }
            });
        }

        // 範例按鈕點擊事件
        const exampleBtns = document.querySelectorAll('.example-btn');
        exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.getAttribute('data-url');
                if (url) {
                    urlInput.value = url;
                    this.handleParse();
                }
            });
        });

        // Mirror 解析按鈕點擊事件
        const mirrorParseBtn = document.getElementById('mirrorParseBtn');
        if (mirrorParseBtn) {
            mirrorParseBtn.addEventListener('click', () => this.handleMirrorParse());
        }

        // Mirror 輸入框回車事件
        const mirrorUrlInput = document.getElementById('mirrorUrlInput');
        if (mirrorUrlInput) {
            mirrorUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleMirrorParse();
                }
            });
        }

        // 複製全部按鈕
        const copyAllBtn = document.getElementById('copyAllBtn');
        if (copyAllBtn) {
            copyAllBtn.addEventListener('click', () => this.copyAllResults());
        }
    }

    handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const url = urlParams.get('url');
        
        if (url) {
            const urlInput = document.getElementById('urlInput');
            if (urlInput) {
                urlInput.value = decodeURIComponent(url);
                // 自動解析
                setTimeout(() => this.handleParse(), 500);
            }
        }
    }

    async handleParse() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();

        console.log('🔍 handleParse 被調用，URL:', url);

        if (!url) {
            this.showToast('請輸入 Bilibili 連結', 'error');
            return;
        }

        // 詳細驗證日誌
        console.log('🔍 開始驗證 URL:', url);
        const isValid = this.isValidBilibiliUrl(url);
        console.log('🔍 驗證結果:', isValid);

        if (!isValid) {
            console.error('❌ URL 驗證失敗，顯示錯誤消息');
            this.showToast(translations[currentLang]['invalidUrl'], 'error');
            return;
        }

        console.log('✅ URL 驗證通過，繼續解析');

        this.showLoading(true);
        
        try {
            const results = await this.parseUrl(url);
            this.displayResults(results);
            this.showToast(translations[currentLang]['success'], 'success');
        } catch (error) {
            console.error('解析錯誤:', error);
            this.showToast(translations[currentLang]['networkError'], 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleMirrorParse() {
        const mirrorUrlInput = document.getElementById('mirrorUrlInput');
        const url = mirrorUrlInput.value.trim();

        if (!url) {
            this.showToast('請輸入 Bilibili 連結', 'error');
            return;
        }

        if (!this.isValidBilibiliUrl(url)) {
            this.showToast(translations[currentLang]['invalidUrl'], 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            const results = await this.parseUrlWithMirror(url);
            this.displayResults(results);
            this.showToast('栖隙居所節點解析成功', 'success');
        } catch (error) {
            console.error('Mirror 解析錯誤:', error);
            this.showToast('栖隙居所節點解析失敗', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    isValidBilibiliUrl(url) {
        // 詳細的輸入檢查
        if (!url) {
            console.log('❌ 驗證失敗: URL 為空', typeof url);
            return false;
        }
        
        if (typeof url !== 'string') {
            console.log('❌ 驗證失敗: URL 不是字符串', typeof url, url);
            return false;
        }
        
        // 去除首尾空白
        const trimmedUrl = url.trim();
        if (!trimmedUrl) {
            console.log('❌ 驗證失敗: URL 為空（去除空白後）');
            return false;
        }
        
        // 如果沒有協議，自動添加 https://
        let processedUrl = trimmedUrl;
        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
            processedUrl = 'https://' + trimmedUrl;
            console.log('🔧 自動添加協議:', processedUrl);
        }
        
        const patterns = [
            /https?:\/\/(www\.)?bilibili\.com\/video\/BV[a-zA-Z0-9]+/,
            /https?:\/\/live\.bilibili\.com\/\d+/,
            /https?:\/\/(www\.)?bilibili\.com\/bangumi\/play\/[a-zA-Z0-9]+/,
            /https?:\/\/(www\.)?bilibili\.com\/.*bvid=BV[a-zA-Z0-9]+/,
            /https?:\/\/b23\.tv\/.*/i  // 支持 b23.tv 短連結（匹配任何字符，包括空）
        ];
        
        // 逐個測試模式，方便調試
        let matchedPattern = null;
        const isValid = patterns.some((pattern, index) => {
            const result = pattern.test(processedUrl);
            if (result) {
                matchedPattern = index;
                console.log(`✅ 模式 ${index} 匹配成功:`, pattern.toString());
            }
            return result;
        });
        
        // 調試信息
        if (isValid) {
            console.log('✅ URL 驗證通過:', { 
                original: url, 
                trimmed: trimmedUrl,
                processed: processedUrl, 
                matchedPattern,
                matchedPatternRegex: patterns[matchedPattern]?.toString()
            });
        } else {
            console.error('❌ URL 驗證失敗:', { 
                original: url, 
                trimmed: trimmedUrl,
                processed: processedUrl,
                patterns: patterns.map((p, i) => ({ 
                    index: i, 
                    pattern: p.toString(), 
                    test: p.test(processedUrl),
                    match: processedUrl.match(p)
                }))
            });
        }
        
        return isValid;
    }

    async parseUrl(url) {
        const results = [];
        
        // 檢查是否是 b23.tv 短連結（允許斜線後有或沒有字符）
        const isB23ShortLink = /b23\.tv\/.*/i.test(url);
        
        if (isB23ShortLink) {
            // 對於 b23.tv 短連結，先通過後端解析短連結獲取完整 URL
            try {
                console.log('🔗 檢測到 b23.tv 短連結，正在解析...');
                // 使用後端 API 解析短連結（通過 ?url= 參數，後端會處理短連結解析）
                const response = await fetch(`${window.location.origin}/api/parse/shortlink?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                
                if (data.success && data.fullUrl) {
                    console.log('✅ 短連結解析成功:', data.fullUrl);
                    // 從完整 URL 中提取 BV 號
                    const bvid = this.extractBvid(data.fullUrl);
                    if (bvid) {
                        // 使用完整 URL 解析影片
                        results.push(...await this.parseVideo(bvid, data.fullUrl));
                    } else {
                        results.push({
                            title: '解析失敗',
                            url: url,
                            type: 'error',
                            description: '無法從解析後的 URL 中提取 BV 號'
                        });
                    }
                } else {
                    results.push({
                        title: '短連結解析失敗',
                        url: url,
                        type: 'error',
                        description: data.message || '無法解析 b23.tv 短連結'
                    });
                }
            } catch (error) {
                console.error('解析短連結失敗:', error);
                results.push({
                    title: '短連結解析錯誤',
                    url: url,
                    type: 'error',
                    description: '無法連接到伺服器解析短連結'
                });
            }
            
            return results;
        }
        
        // 影片解析
        const bvid = this.extractBvid(url);
        if (bvid) {
            results.push(...await this.parseVideo(bvid, url));
        }

        return results;
    }

    async parseUrlWithMirror(url) {
        const results = [];
        
        // 檢查是否是 b23.tv 短連結
        const isB23ShortLink = /b23\.tv\/.*/i.test(url);
        
        if (isB23ShortLink) {
            // 對於 b23.tv 短連結，先通過後端解析短連結獲取完整 URL
            try {
                console.log('🔗 檢測到 b23.tv 短連結（Mirror），正在解析...');
                // 使用後端 API 解析短連結
                const response = await fetch(`${window.location.origin}/api/parse/shortlink?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                
                if (data.success && data.fullUrl) {
                    console.log('✅ 短連結解析成功:', data.fullUrl);
                    // 從完整 URL 中提取 BV 號
                    const bvid = this.extractBvid(data.fullUrl);
                    if (bvid) {
                        // 使用 Mirror 節點解析影片
                        results.push(...await this.parseVideoWithMirror(bvid, data.fullUrl));
                    } else {
                        results.push({
                            title: '解析失敗',
                            url: url,
                            type: 'error',
                            description: '無法從解析後的 URL 中提取 BV 號'
                        });
                    }
                } else {
                    results.push({
                        title: '短連結解析失敗',
                        url: url,
                        type: 'error',
                        description: data.message || '無法解析 b23.tv 短連結'
                    });
                }
            } catch (error) {
                console.error('解析短連結失敗:', error);
                results.push({
                    title: '短連結解析錯誤',
                    url: url,
                    type: 'error',
                    description: '無法連接到伺服器解析短連結'
                });
            }
            
            return results;
        }
        
        // 影片解析 - 使用 Mirror 節點
        const bvid = this.extractBvid(url);
        if (bvid) {
            results.push(...await this.parseVideoWithMirror(bvid, url));
        }

        return results;
    }

    extractBvid(url) {
        // 如果沒有協議，自動添加 https://
        let processedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            processedUrl = 'https://' + url;
        }
        
        // 提取 BV 號
        const patterns = [
            /\/video\/(BV[a-zA-Z0-9]+)/,
            /bvid=(BV[a-zA-Z0-9]+)/,
            /BV[a-zA-Z0-9]+/
        ];

        for (const pattern of patterns) {
            const match = processedUrl.match(pattern);
            if (match) {
                return match[1] || match[0];
            }
        }
        return null;
    }


    async parseVideo(bvid, originalUrl) {
        const results = [];
        
        try {
            console.log('開始解析影片:', bvid);
            
            // 影片資訊
            results.push({
                title: '影片資訊',
                url: originalUrl,
                type: 'info',
                description: `BV${bvid} - 已提取影片 ID`
            });

            // 通過我們的伺服器 API 獲取影片資訊（避免 CORS 問題）
            try {
                const response = await fetch(`${window.location.origin}/api/parse/video/${bvid}`);
                const data = await response.json();
                
                if (data.success && data.data) {
                    // 顯示解析結果
                    data.data.forEach(item => {
                        results.push({
                            title: item.title,
                            url: item.url,
                            type: item.type || 'stream',
                            description: item.description || '解析結果'
                        });
                    });
                } else {
                    // 如果伺服器解析失敗，提供基本連結
                    results.push({
                        title: '伺服器解析失敗',
                        url: originalUrl,
                        type: 'info',
                        description: '請檢查伺服器狀態或稍後再試'
                    });
                }
            } catch (error) {
                console.error('調用伺服器 API 失敗:', error);
                // 降級方案：提供基本連結
                results.push({
                    title: 'API 調用失敗',
                    url: originalUrl,
                    type: 'info',
                    description: '無法連接到伺服器，請檢查網路連接'
                });
            }

            // 原始連結
            results.push({
                title: '原始連結',
                url: originalUrl,
                type: 'original',
                description: 'Bilibili 原始影片連結'
            });

        } catch (error) {
            console.error('影片解析錯誤:', error);
            // 降級方案：提供基本連結
            results.push({
                title: '原始連結',
                url: originalUrl,
                type: 'original',
                description: 'Bilibili 原始影片連結'
            });
        }

        return results;
    }





    async parseLive(roomId) {
        const results = [];
        const liveUrl = `https://live.bilibili.com/${roomId}`;
        
        try {
            console.log('開始解析直播:', roomId);
            
            // 直播資訊
            results.push({
                title: '直播資訊',
                url: liveUrl,
                type: 'info',
                description: `直播間 ${roomId} - 已提取直播間 ID`
            });

            // 通過我們的伺服器 API 獲取直播資訊（避免 CORS 問題）
            try {
                const response = await fetch(`${window.location.origin}/api/parse/live/${roomId}`);
                const data = await response.json();
                
                if (data.success && data.data) {
                    // 顯示解析結果
                    data.data.forEach(item => {
                        results.push({
                            title: item.title,
                            url: item.url,
                            type: item.type || 'stream',
                            description: item.description || '解析結果'
                        });
                    });
                } else {
                    // 如果伺服器解析失敗，提供基本連結
                    results.push({
                        title: '伺服器解析失敗',
                        url: liveUrl,
                        type: 'info',
                        description: '請檢查伺服器狀態或稍後再試'
                    });
                }
            } catch (error) {
                console.error('調用伺服器 API 失敗:', error);
                // 降級方案：提供基本連結
                results.push({
                    title: 'API 調用失敗',
                    url: liveUrl,
                    type: 'info',
                    description: '無法連接到伺服器，請檢查網路連接'
                });
            }

            // 原始連結
            results.push({
                title: '原始直播連結',
                url: liveUrl,
                type: 'original',
                description: 'Bilibili 原始直播連結'
            });

        } catch (error) {
            console.error('直播解析錯誤:', error);
            // 降級方案：提供基本連結
            results.push({
                title: '原始直播連結',
                url: liveUrl,
                type: 'original',
                description: 'Bilibili 原始直播連結'
            });
        }

        return results;
    }





    displayResults(results) {
        const resultSection = document.getElementById('resultSection');
        const resultContent = document.getElementById('resultContent');
        
        if (!results || results.length === 0) {
            resultSection.style.display = 'none';
            return;
        }

        this.currentResults = results;
        
        // 清空之前的結果
        resultContent.innerHTML = '';
        
        // 顯示結果
        results.forEach((result, index) => {
            const resultItem = this.createResultItem(result, index);
            resultContent.appendChild(resultItem);
        });
        
        resultSection.style.display = 'block';
        
        // 自動複製第一個結果
        if (results.length > 0) {
            this.copyToClipboard(results[0].url);
        }
    }

    createResultItem(result, index) {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        const icon = this.getIconForType(result.type);
        
        // 處理流地址，避免自動下載
        const displayUrl = result.type === 'stream' ? 
            `${result.url.substring(0, 50)}...` : 
            result.url;
        
        item.innerHTML = `
            <div class="result-title">
                <i class="${icon}"></i>
                ${result.title}
            </div>
            <div class="result-url" style="word-break: break-all;">${displayUrl}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <small style="color: var(--text-secondary);">${result.description}</small>
                <div>
                    ${result.type === 'stream' ? `
                        <button class="copy-btn" onclick="bilibiliParser.copyToClipboard('${result.url}')" style="margin-right: 8px;">
                            <i class="fas fa-copy"></i>
                            ${translations[currentLang]['copy']}
                        </button>
                        <button class="copy-btn" onclick="window.open('${result.url}', '_blank')" style="background: var(--accent-color);">
                            <i class="fas fa-external-link-alt"></i>
                            播放
                        </button>
                    ` : `
                        <button class="copy-btn" onclick="bilibiliParser.copyToClipboard('${result.url}')">
                            <i class="fas fa-copy"></i>
                            ${translations[currentLang]['copy']}
                        </button>
                    `}
                </div>
            </div>
        `;
        
        return item;
    }

    getIconForType(type) {
        const icons = {
            'video': 'fas fa-video',
            'live': 'fas fa-broadcast-tower',
            'stream': 'fas fa-stream',
            'original': 'fas fa-link',
            'info': 'fas fa-info-circle'
        };
        return icons[type] || 'fas fa-link';
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(translations[currentLang]['copied'], 'success');
        } catch (error) {
            // 降級方案
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast(translations[currentLang]['copied'], 'success');
        } catch (error) {
            this.showToast(translations[currentLang]['error'], 'error');
        }
        
        document.body.removeChild(textArea);
    }

    copyAllResults() {
        if (this.currentResults.length === 0) {
            this.showToast(translations[currentLang]['noResults'], 'warning');
            return;
        }

        const allUrls = this.currentResults.map(result => result.url).join('\n');
        this.copyToClipboard(allUrls);
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const parseBtn = document.getElementById('parseBtn');
        
        if (show) {
            loadingOverlay.style.display = 'flex';
            parseBtn.disabled = true;
            parseBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${translations[currentLang]['loading']}`;
            this.isLoading = true;
        } else {
            loadingOverlay.style.display = 'none';
            parseBtn.disabled = false;
            parseBtn.innerHTML = `<i class="fas fa-play"></i> <span data-zh="解析" data-ja="解析">解析</span>`;
            this.isLoading = false;
        }
    }

    createToast() {
        const toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        // 移除之前的類型類
        toast.classList.remove('success', 'error', 'warning');
        
        // 添加新的類型類
        if (type !== 'info') {
            toast.classList.add(type);
        }

        toast.textContent = message;
        toast.classList.add('show');

        // 3秒後自動隱藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 清理 URL 參數（參考原項目）
    cleanUrl(url) {
        if (!url || !url.includes('bilibili.com')) {
            return url;
        }

        try {
            const urlObj = new URL(url);
            const paramsToRemove = [
                'spm_id_from', 'from_source', 'msource', 'bsource', 'seid',
                'source', 'session_id', 'visit_id', 'sourceFrom', 'from_spmid',
                'share_source', 'share_medium', 'share_plat', 'share_session_id',
                'share_tag', 'unique_k', 'csource', 'vd_source', 'tab',
                'is_story_h5', 'share_from', 'plat_id', '-Arouter', 'spmid'
            ];

            paramsToRemove.forEach(param => {
                urlObj.searchParams.delete(param);
            });

            return urlObj.toString();
        } catch (error) {
            return url;
        }
    }
}

// 工具函數
function debounce(func, delay) {
    let timer = null;
    return function(...args) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            func.apply(this, args);
            timer = null;
        }, delay);
    };
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    // 更新版權年份
    updateCopyrightYear();
    
    // 創建全局實例
    window.bilibiliParser = new BilibiliParser();
    
    // 加載統計數據
    loadStats();
    
    // 添加一些額外的功能
    addKeyboardShortcuts();
    addUrlValidation();
});

// 更新版權年份
function updateCopyrightYear() {
    const yearElement = document.getElementById('copyrightYear');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        const startYear = 2025;
        // 如果當前年份大於 2025，顯示範圍，否則只顯示當前年份
        if (currentYear > startYear) {
            yearElement.textContent = `${startYear}-${currentYear}`;
        } else {
            yearElement.textContent = currentYear.toString();
        }
    }
}

// 鍵盤快捷鍵
function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter 快速解析
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (window.bilibiliParser) {
                window.bilibiliParser.handleParse();
            }
        }
        
        // Escape 隱藏結果
        if (e.key === 'Escape') {
            const resultSection = document.getElementById('resultSection');
            if (resultSection) {
                resultSection.style.display = 'none';
            }
        }
    });
}

// URL 驗證
function addUrlValidation() {
    const urlInput = document.getElementById('urlInput');
    if (!urlInput) return;

    const debouncedValidation = debounce((url) => {
        if (!url || !url.trim()) {
            // 空輸入時恢復默認邊框
            urlInput.style.borderColor = 'var(--border-color)';
            return;
        }
        
        const trimmedUrl = url.trim();
        console.log('🔍 實時驗證 URL:', trimmedUrl);
        
        if (window.bilibiliParser && window.bilibiliParser.isValidBilibiliUrl) {
            const isValid = window.bilibiliParser.isValidBilibiliUrl(trimmedUrl);
            console.log('🔍 實時驗證結果:', isValid);
            
            if (isValid) {
                urlInput.style.borderColor = 'var(--border-color)';
            } else {
                urlInput.style.borderColor = 'var(--error-color)';
            }
        } else {
            console.warn('⚠️ bilibiliParser 或 isValidBilibiliUrl 未初始化');
            urlInput.style.borderColor = 'var(--border-color)';
        }
    }, 300);

    urlInput.addEventListener('input', (e) => {
        debouncedValidation(e.target.value);
    });
}

// 錯誤處理
window.addEventListener('error', (e) => {
    console.error('全局錯誤:', e.error);
    if (window.bilibiliParser) {
        window.bilibiliParser.showToast('發生未知錯誤', 'error');
    }
});

// 未處理的 Promise 拒絕
window.addEventListener('unhandledrejection', (e) => {
    console.error('未處理的 Promise 拒絕:', e.reason);
    if (window.bilibiliParser) {
        window.bilibiliParser.showToast('網路請求失敗', 'error');
    }
});

// 添加 parseVideoWithMirror 方法到 BilibiliParser 類
BilibiliParser.prototype.parseVideoWithMirror = async function(bvid, originalUrl) {
    const results = [];
    
    try {
        console.log('開始使用栖隙居所節點解析影片:', bvid);
        
        // 影片資訊
        results.push({
            title: '影片資訊 (栖隙居所節點)',
            url: originalUrl,
            type: 'info',
            description: `BV${bvid} - 使用 upos-sz-mirror08c.bilivideo.com 節點解析 (栖隙居所)`
        });

        // 通過我們的伺服器 API 獲取影片資訊（使用 Mirror 節點）
        try {
            const response = await fetch(`${window.location.origin}/api/parse/video/${bvid}?mirror=true`);
            const data = await response.json();
            
            if (data.success && data.data) {
                    // 顯示解析結果
                    data.data.forEach(item => {
                        results.push({
                            title: item.title + ' (栖隙居所)',
                            url: item.url,
                            type: item.type || 'stream',
                            description: item.description || '栖隙居所節點解析結果'
                        });
                    });
            } else {
                // 如果伺服器解析失敗，提供基本連結
                results.push({
                    title: '栖隙居所節點解析失敗',
                    url: originalUrl,
                    type: 'info',
                    description: '請檢查伺服器狀態或稍後再試'
                });
            }
        } catch (error) {
            console.error('調用栖隙居所節點 API 失敗:', error);
            // 降級方案：提供基本連結
            results.push({
                title: '栖隙居所 API 調用失敗',
                url: originalUrl,
                type: 'info',
                description: '無法連接到伺服器，請檢查網路連接'
            });
        }

        // 原始連結
        results.push({
            title: '原始連結',
            url: originalUrl,
            type: 'original',
            description: 'Bilibili 原始影片連結'
        });

    } catch (error) {
        console.error('栖隙居所節點影片解析錯誤:', error);
        // 降級方案：提供基本連結
        results.push({
            title: '原始連結',
            url: originalUrl,
            type: 'original',
            description: 'Bilibili 原始影片連結'
        });
    }

    return results;
};

// 導出給全局使用
window.BilibiliParser = BilibiliParser;
