// Bilibili 解析工具 JavaScript

// 計數器相關功能 - 重新設計
let serviceCounters = {
    total: 0,
    today: 0,
    thisMonth: 0
};

// 加載計數器數據
async function loadCounters() {
    try {
        console.log('🔄 正在加載計數器數據...');
        const response = await fetch('/api/counters');
        const data = await response.json();
        
        if (data.success && data.data) {
            serviceCounters = {
                total: data.data.total || 0,
                today: data.data.today || 0,
                thisMonth: data.data.thisMonth || 0
            };
            console.log('✅ 計數器數據加載成功:', serviceCounters);
            updateCounterDisplay();
        } else {
            console.warn('⚠️ 計數器數據格式錯誤:', data);
            updateCounterDisplay(); // 使用默認值
        }
    } catch (error) {
        console.error('❌ 加載計數器失敗:', error);
        updateCounterDisplay(); // 使用默認值
    }
}

// 更新計數器顯示
function updateCounterDisplay() {
    console.log('🔄 更新計數器顯示:', serviceCounters);
    
    const todayCount = document.getElementById('todayCount');
    const monthCount = document.getElementById('monthCount');
    const totalCount = document.getElementById('totalCount');
    
    if (todayCount) {
        todayCount.textContent = serviceCounters.today.toLocaleString();
        console.log('✅ 今日服務更新為:', serviceCounters.today);
    } else {
        console.error('❌ 找不到 todayCount 元素');
    }
    
    if (monthCount) {
        monthCount.textContent = serviceCounters.thisMonth.toLocaleString();
        console.log('✅ 本月服務更新為:', serviceCounters.thisMonth);
    } else {
        console.error('❌ 找不到 monthCount 元素');
    }
    
    if (totalCount) {
        totalCount.textContent = serviceCounters.total.toLocaleString();
        console.log('✅ 累計服務更新為:', serviceCounters.total);
    } else {
        console.error('❌ 找不到 totalCount 元素');
    }
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

    isValidBilibiliUrl(url) {
        const patterns = [
            /https?:\/\/(www\.)?bilibili\.com\/video\/BV[a-zA-Z0-9]+/,
            /https?:\/\/live\.bilibili\.com\/\d+/,
            /https?:\/\/(www\.)?bilibili\.com\/bangumi\/play\/[a-zA-Z0-9]+/,
            /https?:\/\/(www\.)?bilibili\.com\/.*bvid=BV[a-zA-Z0-9]+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    async parseUrl(url) {
        const results = [];
        
        // 影片解析
        const bvid = this.extractBvid(url);
        if (bvid) {
            results.push(...await this.parseVideo(bvid, url));
        }

        return results;
    }

    extractBvid(url) {
        // 提取 BV 號
        const patterns = [
            /\/video\/(BV[a-zA-Z0-9]+)/,
            /bvid=(BV[a-zA-Z0-9]+)/,
            /BV[a-zA-Z0-9]+/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
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
        
        item.innerHTML = `
            <div class="result-title">
                <i class="${icon}"></i>
                ${result.title}
            </div>
            <div class="result-url">${result.url}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <small style="color: var(--text-secondary);">${result.description}</small>
                <button class="copy-btn" onclick="bilibiliParser.copyToClipboard('${result.url}')">
                    <i class="fas fa-copy"></i>
                    ${translations[currentLang]['copy']}
                </button>
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
    // 創建全局實例
    window.bilibiliParser = new BilibiliParser();
    
    // 加載計數器數據
    loadCounters();
    
    // 添加一些額外的功能
    addKeyboardShortcuts();
    addUrlValidation();
});

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
        if (url && !window.bilibiliParser.isValidBilibiliUrl(url)) {
            urlInput.style.borderColor = 'var(--error-color)';
        } else {
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

// 導出給全局使用
window.BilibiliParser = BilibiliParser;
