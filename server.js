const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const geoip = require('geoip-lite');

const app = express();

const PORT = process.env.PORT || 3000;

// 服務計數器
let serviceCounters = {
    total: 0,           // 累計總服務次數
    today: 0,           // 今日服務次數
    thisMonth: 0,       // 本月服務次數
    lastResetDate: new Date().toDateString(), // 上次重置日期
    lastResetMonth: new Date().getMonth()     // 上次重置月份
};

// 中間件
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// 配置 Express 來獲取真實 IP 地址
app.set('trust proxy', true);

// 獲取地理位置資訊的函數
function getLocationInfo(ip) {
    // 跳過本地 IP
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return '本地網路';
    }
    
    const geo = geoip.lookup(ip);
    if (geo) {
        return `${geo.country} ${geo.city || geo.region || ''}`.trim();
    }
    return '未知位置';
}

// 計數器管理函數
function updateCounters() {
    const now = new Date();
    const today = now.toDateString();
    const thisMonth = now.getMonth();
    
    // 檢查是否需要重置今日計數
    if (serviceCounters.lastResetDate !== today) {
        serviceCounters.today = 0;
        serviceCounters.lastResetDate = today;
    }
    
    // 檢查是否需要重置本月計數
    if (serviceCounters.lastResetMonth !== thisMonth) {
        serviceCounters.thisMonth = 0;
        serviceCounters.lastResetMonth = thisMonth;
    }
    
    // 增加計數
    serviceCounters.total++;
    serviceCounters.today++;
    serviceCounters.thisMonth++;
    
    return {
        total: serviceCounters.total,
        today: serviceCounters.today,
        thisMonth: serviceCounters.thisMonth
    };
}

// 獲取計數器資訊的函數
function getCounters() {
    const now = new Date();
    const today = now.toDateString();
    const thisMonth = now.getMonth();
    
    // 確保計數器是最新的
    if (serviceCounters.lastResetDate !== today) {
        serviceCounters.today = 0;
        serviceCounters.lastResetDate = today;
    }
    
    if (serviceCounters.lastResetMonth !== thisMonth) {
        serviceCounters.thisMonth = 0;
        serviceCounters.lastResetMonth = thisMonth;
    }
    
    return {
        total: serviceCounters.total,
        today: serviceCounters.today,
        thisMonth: serviceCounters.thisMonth
    };
}

// 解析 b23.tv 短連結，獲取完整的 Bilibili URL
async function resolveB23ShortLink(shortUrl) {
    try {
        // 確保 URL 包含協議
        let url = shortUrl;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // 發送 GET 請求跟隨重定向，但限制響應體大小
        const response = await axios.get(url, {
            maxRedirects: 5,
            validateStatus: (status) => status < 400,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/'
            },
            // 限制響應體大小，避免下載完整頁面
            maxContentLength: 1024 * 1024, // 1MB
            timeout: 5000 // 5秒超時
        });
        
        // 從響應的 request 中獲取最終 URL
        // axios 會自動跟隨重定向，最終 URL 在 response.request.res.responseUrl
        const finalUrl = response.request?.res?.responseUrl || 
                        response.request?.res?.response?.headers?.location ||
                        response.config?.url ||
                        url;
        
        return finalUrl;
    } catch (error) {
        // 如果請求失敗，嘗試從錯誤響應中獲取重定向 URL
        if (error.response && error.response.headers && error.response.headers.location) {
            return error.response.headers.location;
        }
        console.error(`❌ 解析 b23.tv 短連結失敗: ${shortUrl}`, error.message);
        return null;
    }
}

// 節點狀態管理 - 三個主要節點 + Mirror 節點
const nodeStatus = {
    // 深圳節點 (華南)
    'upos-sz-estgoss.bilivideo.com': { available: true, lastCheck: 0, successCount: 0, failCount: 0, region: '深圳' },
    'upos-bj-estgoss.bilivideo.com': { available: true, lastCheck: 0, successCount: 0, failCount: 0, region: '北京' },
    'upos-hz-estgoss.bilivideo.com': { available: true, lastCheck: 0, successCount: 0, failCount: 0, region: '杭州' },
    
    // Mirror 節點 (專用，不參與智能選擇)
    'upos-sz-mirror08c.bilivideo.com': { available: true, lastCheck: 0, successCount: 0, failCount: 0, region: 'Mirror', isMirror: true }
};

// 檢查節點是否可用
async function checkNodeAvailability(node, bvid) {
    try {
        const testUrl = `https://${node}/upgcxcode/00/44/1234567890/${bvid}/1-112.flv?deadline=1234567890&gen=playurl&nbs=1&oi=1234567890&os=upos-sz&platform=pc&trid=1234567890&uipk=5&upsig=1234567890&uparams=,C0,E0&mid=0&orderid=0,3&agrr=0&logo=80000000`;
        
        const response = await axios.head(testUrl, { 
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/'
            }
        });
        
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

// 智能選擇最佳節點
async function getBestAvailableNode(bvid) {
    const mainNodes = Object.keys(nodeStatus).filter(node => !nodeStatus[node].isMirror);
    
    // 按成功率排序，選擇最穩定的節點
    const sortedNodes = mainNodes.sort((a, b) => {
        const aStatus = nodeStatus[a];
        const bStatus = nodeStatus[b];
        const aRate = aStatus.successCount / (aStatus.successCount + aStatus.failCount || 1);
        const bRate = bStatus.successCount / (bStatus.successCount + bStatus.failCount || 1);
        return bRate - aRate;
    });
    
    // 優先選擇成功率最高的節點
    const bestNode = sortedNodes[0];
    console.log(`🎯 選擇節點: ${bestNode} (${nodeStatus[bestNode].region})`);
    return bestNode;
}

// 隨機選擇主節點的函數（保留作為備用）
function getRandomMainNode() {
    const mainNodes = Object.keys(nodeStatus);
    return mainNodes[Math.floor(Math.random() * mainNodes.length)];
}

// 帶超時的解析函數
async function parseWithTimeout(bvid, timeoutMs = 10000) {
    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('解析超時'));
        }, timeoutMs);

        try {
            const result = await parseVideoWithRetry(bvid);
            clearTimeout(timeout);
            resolve(result);
        } catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
}

// 帶超時的 Niche 解析函數（強制使用 upos-sz-mirrorcos.bilivideo.com）
async function parseWithTimeoutForNiche(bvid, timeoutMs = 10000) {
    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Niche 解析超時'));
        }, timeoutMs);

        try {
            const result = await parseVideoWithRetryForNiche(bvid);
            clearTimeout(timeout);
            resolve(result);
        } catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
}

// 重試解析函數
async function parseVideoWithRetry(bvid, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const attemptStartTime = Date.now();
            console.log(`🔄 嘗試解析 (第 ${attempt}/${maxRetries} 次): ${bvid} | 開始時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
            
            // 獲取影片資訊
            const videoInfoResponse = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.bilibili.com/'
                }
            });

            if (videoInfoResponse.data.code === 0) {
                const videoData = videoInfoResponse.data.data;
                const cid = videoData.cid;
                
                // 嘗試獲取 1440P 流地址
                const streamResponse = await axios.get(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=112&fnval=16&platform=html5`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://www.bilibili.com/'
                    }
                });
                
                if (streamResponse.data.code === 0) {
                    const streamData = streamResponse.data.data;
                    
                    // 優先選擇 DASH 格式的 1440P 視頻流
                    if (streamData.dash && streamData.dash.video) {
                        const dash1440P = streamData.dash.video.find(item => item.id === 112);
                        if (dash1440P) {
                            const selectedMainNode = await getBestAvailableNode(bvid);
                            let mainNodeUrl = dash1440P.baseUrl;
                            // 替換三個主要CDN節點
                            mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.bilivideo\.com/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            
                            // 替換國際CDN節點
                            mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.akamaized\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.akamaized\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.cloudfront\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.cloudfront\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.cloudfront\.net/, selectedMainNode);
                            
                            // 通用替換（備用）
                            mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.bilivideo\.com/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.akamaized\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.cloudfront\.net/, selectedMainNode);
                            
                            const attemptEndTime = Date.now();
                            const attemptTime = attemptEndTime - attemptStartTime;
                            
                            // 記錄節點成功
                            if (nodeStatus[selectedMainNode]) {
                                nodeStatus[selectedMainNode].successCount++;
                                nodeStatus[selectedMainNode].available = true;
                            }
                            
                            console.log(`✅ 解析成功 (第 ${attempt} 次嘗試) | 格式: DASH | 品質: 1440P | 節點: ${selectedMainNode} | 嘗試時間: ${attemptTime}ms`);
                            return { url: mainNodeUrl, format: 'DASH', node: selectedMainNode };
                        }
                    }
                    
                    // 如果沒有 DASH，選擇 FLV 格式
                    if (streamData.durl && streamData.durl.length > 0) {
                        const selectedMainNode = await getBestAvailableNode(bvid);
                        let mainNodeUrl = streamData.durl[0].url;
                        // 替換三個主要CDN節點
                        mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.bilivideo\.com/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.bilivideo\.com/, selectedMainNode);
                        
                        // 替換國際CDN節點
                        mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.akamaized\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.akamaized\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.cloudfront\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.cloudfront\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.cloudfront\.net/, selectedMainNode);
                        
                        // 通用替換（備用）
                        mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.bilivideo\.com/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.akamaized\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.cloudfront\.net/, selectedMainNode);
                        
                        const attemptEndTime = Date.now();
                        const attemptTime = attemptEndTime - attemptStartTime;
                        
                        // 記錄節點成功
                        if (nodeStatus[selectedMainNode]) {
                            nodeStatus[selectedMainNode].successCount++;
                            nodeStatus[selectedMainNode].available = true;
                        }
                        
                        console.log(`✅ 解析成功 (第 ${attempt} 次嘗試) | 格式: FLV | 品質: 1440P | 節點: ${selectedMainNode} | 嘗試時間: ${attemptTime}ms`);
                        return { url: mainNodeUrl, format: 'FLV', node: selectedMainNode };
                    }
                }
            }
            
            throw new Error('無法獲取流地址');
            
        } catch (error) {
            const attemptEndTime = Date.now();
            const attemptTime = attemptEndTime - attemptStartTime;
            
            // 記錄節點失敗（如果知道使用的節點）
            // 這裡我們無法直接知道失敗的節點，所以不記錄失敗
            
            console.log(`❌ 第 ${attempt} 次嘗試失敗: ${error.message} | 嘗試時間: ${attemptTime}ms`);
            if (attempt === maxRetries) {
                throw error;
            }
            // 等待 1 秒後重試
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// 重試解析函數（Niche 專用 - 強制使用 upos-sz-mirrorcos.bilivideo.com）
async function parseVideoWithRetryForNiche(bvid, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const attemptStartTime = Date.now();
            console.log(`🔄 Niche 嘗試解析 (第 ${attempt}/${maxRetries} 次): ${bvid} | 開始時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
            
            // 獲取影片資訊
            const videoInfoResponse = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.bilibili.com/'
                }
            });

            if (videoInfoResponse.data.code === 0) {
                const videoData = videoInfoResponse.data.data;
                const cid = videoData.cid;
                
                // 嘗試獲取 1440P 流地址
                const streamResponse = await axios.get(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=112&fnval=16&platform=html5`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://www.bilibili.com/'
                    }
                });
                
                if (streamResponse.data.code === 0) {
                    const streamData = streamResponse.data.data;
                    
                    // 優先選擇 DASH 格式的 1440P 視頻流
                    if (streamData.dash && streamData.dash.video) {
                        const dash1440P = streamData.dash.video.find(item => item.id === 112);
                        if (dash1440P) {
                            const selectedMainNode = 'upos-sz-mirror08c.bilivideo.com'; // 強制使用 niche 節點
                            let mainNodeUrl = dash1440P.baseUrl;
                            // 替換所有CDN節點為 niche 節點
                            mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.bilivideo\.com/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            
                            // 替換國際CDN節點
                            mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.akamaized\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.akamaized\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.cloudfront\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.cloudfront\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.cloudfront\.net/, selectedMainNode);
                            
                            // 通用替換（備用）
                            mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.bilivideo\.com/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.akamaized\.net/, selectedMainNode);
                            mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.cloudfront\.net/, selectedMainNode);
                            
                            const attemptEndTime = Date.now();
                            const attemptTime = attemptEndTime - attemptStartTime;
                            
                            // 記錄節點成功
                            if (nodeStatus[selectedMainNode]) {
                                nodeStatus[selectedMainNode].successCount++;
                                nodeStatus[selectedMainNode].available = true;
                            }
                            
                            console.log(`✅ Niche 解析成功 (第 ${attempt} 次嘗試) | 格式: DASH | 品質: 1440P | 節點: ${selectedMainNode} | 嘗試時間: ${attemptTime}ms`);
                            return { url: mainNodeUrl, format: 'DASH', node: selectedMainNode };
                        }
                    }
                    
                    // 如果沒有 DASH，選擇 FLV 格式
                    if (streamData.durl && streamData.durl.length > 0) {
                        const selectedMainNode = 'upos-sz-mirror08c.bilivideo.com'; // 強制使用 niche 節點
                        let mainNodeUrl = streamData.durl[0].url;
                        // 替換所有CDN節點為 niche 節點
                        mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.bilivideo\.com/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.bilivideo\.com/, selectedMainNode);
                        
                        // 替換國際CDN節點
                        mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.akamaized\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.akamaized\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.cloudfront\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.cloudfront\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-bj-[^/]+\.cloudfront\.net/, selectedMainNode);
                        
                        // 通用替換（備用）
                        mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.bilivideo\.com/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.akamaized\.net/, selectedMainNode);
                        mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.cloudfront\.net/, selectedMainNode);
                        
                        const attemptEndTime = Date.now();
                        const attemptTime = attemptEndTime - attemptStartTime;
                        
                        // 記錄節點成功
                        if (nodeStatus[selectedMainNode]) {
                            nodeStatus[selectedMainNode].successCount++;
                            nodeStatus[selectedMainNode].available = true;
                        }
                        
                        console.log(`✅ Niche 解析成功 (第 ${attempt} 次嘗試) | 格式: FLV | 品質: 1440P | 節點: ${selectedMainNode} | 嘗試時間: ${attemptTime}ms`);
                        return { url: mainNodeUrl, format: 'FLV', node: selectedMainNode };
                    }
                }
            }
            
            throw new Error('無法獲取流地址');
            
        } catch (error) {
            const attemptEndTime = Date.now();
            const attemptTime = attemptEndTime - attemptStartTime;
            
            console.log(`❌ Niche 第 ${attempt} 次嘗試失敗: ${error.message} | 嘗試時間: ${attemptTime}ms`);
            if (attempt === maxRetries) {
                throw error;
            }
            // 等待 1 秒後重試
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// 解析並重定向到 Niche 節點 1440P 流地址的函數
async function parseAndRedirectToNiche(req, res, bvid) {
    try {
        // 嘗試多種方式獲取真實 IP
        let clientIP = req.ip || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress ||
                      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.headers['cf-connecting-ip'] ||
                      'unknown';
        
        // 清理 IPv6 映射的 IPv4 地址
        if (clientIP.startsWith('::ffff:')) {
            clientIP = clientIP.substring(7);
        }
        const userAgent = req.headers['user-agent'] || 'unknown';
        const acceptLanguage = req.headers['accept-language'] || 'unknown';
        const referer = req.headers['referer'] || 'direct';
        const timestamp = new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'});
        const location = getLocationInfo(clientIP);
        
        const startTime = Date.now();
        console.log(`🔄 Niche 重定向解析: ${bvid}`);
        console.log(`   請求者: ${clientIP} | 位置: ${location} | 時間: ${timestamp}`);
        console.log(`   瀏覽器: ${userAgent.substring(0, 50)}...`);
        console.log(`   語言: ${acceptLanguage.substring(0, 20)}... | 來源: ${referer.substring(0, 30)}...`);
        console.log(`   ⏱️ 解析開始時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
        
        // 使用帶超時的重試解析（強制使用 niche 節點）
        try {
            const result = await parseWithTimeoutForNiche(bvid, 10000); // 10秒超時
            const endTime = Date.now();
            const parseTime = endTime - startTime;
            // 更新服務計數器
            const counters = updateCounters();
            console.log(`✅ Niche 解析成功 | 格式: ${result.format} | 品質: 1440P | 節點: ${result.node} | 解析時間: ${parseTime}ms | 服務次數: 今日${counters.today}次/本月${counters.thisMonth}次/累計${counters.total}次 | 完成時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
            return res.redirect(result.url);
        } catch (error) {
            const endTime = Date.now();
            const parseTime = endTime - startTime;
            console.log(`❌ Niche 解析失敗: ${bvid} - ${error.message} | 解析時間: ${parseTime}ms | 失敗時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
            throw error;
        }
        
    } catch (error) {
        console.error(`❌ Niche 解析重定向錯誤: ${bvid} - ${error.message}`);
        // 錯誤時重定向到原始 Bilibili 頁面
        return res.redirect(`https://www.bilibili.com/video/${bvid}`);
    }
}

// 解析並重定向到 1440P 流地址的函數
async function parseAndRedirectTo1440P(req, res, bvid) {
    try {
        // 嘗試多種方式獲取真實 IP
        let clientIP = req.ip || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress ||
                      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.headers['cf-connecting-ip'] ||
                      'unknown';
        
        // 清理 IPv6 映射的 IPv4 地址
        if (clientIP.startsWith('::ffff:')) {
            clientIP = clientIP.substring(7);
        }
        const userAgent = req.headers['user-agent'] || 'unknown';
        const acceptLanguage = req.headers['accept-language'] || 'unknown';
        const referer = req.headers['referer'] || 'direct';
        const timestamp = new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'});
        const location = getLocationInfo(clientIP);
        
        const startTime = Date.now();
        console.log(`🔄 重定向解析: ${bvid}`);
        console.log(`   請求者: ${clientIP} | 位置: ${location} | 時間: ${timestamp}`);
        console.log(`   瀏覽器: ${userAgent.substring(0, 50)}...`);
        console.log(`   語言: ${acceptLanguage.substring(0, 20)}... | 來源: ${referer.substring(0, 30)}...`);
        console.log(`   ⏱️ 解析開始時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
        
        // 使用帶超時的重試解析
        try {
            const result = await parseWithTimeout(bvid, 10000); // 10秒超時
            const endTime = Date.now();
            const parseTime = endTime - startTime;
            // 更新服務計數器
            const counters = updateCounters();
            console.log(`✅ 解析成功 | 格式: ${result.format} | 品質: 1440P | 節點: ${result.node} | 解析時間: ${parseTime}ms | 服務次數: 今日${counters.today}次/本月${counters.thisMonth}次/累計${counters.total}次 | 完成時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
            return res.redirect(result.url);
        } catch (error) {
            const endTime = Date.now();
            const parseTime = endTime - startTime;
            console.log(`❌ 解析失敗: ${bvid} - ${error.message} | 解析時間: ${parseTime}ms | 失敗時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
            throw error;
        }
        
    } catch (error) {
        console.error(`❌ 解析重定向錯誤: ${bvid} - ${error.message}`);
        // 錯誤時重定向到原始 Bilibili 頁面
        return res.redirect(`https://www.bilibili.com/video/${bvid}`);
    }
}

// Niche 專用路由 - 只使用 upos-sz-mirrorcos.bilivideo.com 節點
app.get('/niche/', async (req, res) => {
    const { url } = req.query;
    if (url) {
        // 嘗試多種方式獲取真實 IP
        let clientIP = req.ip || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress ||
                      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.headers['cf-connecting-ip'] ||
                      'unknown';
        
        // 清理 IPv6 映射的 IPv4 地址
        if (clientIP.startsWith('::ffff:')) {
            clientIP = clientIP.substring(7);
        }
        const userAgent = req.headers['user-agent'] || 'unknown';
        const acceptLanguage = req.headers['accept-language'] || 'unknown';
        const referer = req.headers['referer'] || 'direct';
        const timestamp = new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'});
        const location = getLocationInfo(clientIP);
        
        const startTime = Date.now();
        console.log(`🎯 Niche 解析請求: ${url} (強制使用 upos-sz-mirror08c.bilivideo.com)`);
        console.log(`   請求者: ${clientIP} | 位置: ${location} | 時間: ${timestamp}`);
        console.log(`   瀏覽器: ${userAgent.substring(0, 50)}...`);
        console.log(`   語言: ${acceptLanguage.substring(0, 20)}... | 來源: ${referer.substring(0, 30)}...`);
        console.log(`   ⏱️ 請求開始時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);

        // 檢查是否是 Bilibili 影片連結，支援多種格式
        let processedUrl = url;
        
        // 智能處理各種 URL 格式
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // 如果沒有協議，自動添加 https://
            if (url.startsWith('www.bilibili.com') || url.startsWith('bilibili.com')) {
                processedUrl = 'https://' + url;
            } else if (url.startsWith('BV')) {
                // 如果直接是 BV 號，構建完整 URL
                processedUrl = 'https://www.bilibili.com/video/' + url;
            } else {
                processedUrl = 'https://' + url;
            }
        }
        
        // 檢查是否是 b23.tv 短連結
        if (processedUrl.includes('b23.tv/')) {
            console.log(`🔗 檢測到 b23.tv 短連結，正在解析...`);
            const resolvedUrl = await resolveB23ShortLink(processedUrl);
            if (resolvedUrl) {
                processedUrl = resolvedUrl;
                console.log(`✅ 短連結解析成功: ${resolvedUrl}`);
            } else {
                console.log(`❌ 短連結解析失敗`);
                // 短連結解析失敗，顯示錯誤頁面
                return res.send(`
                    <!DOCTYPE html>
                    <html lang="zh-TW">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>解析失敗</title>
                        <style>
                            body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; text-align: center; padding: 50px; }
                            .error { background: #333; padding: 20px; border-radius: 8px; border: 2px solid #ff4444; }
                        </style>
                    </head>
                    <body>
                        <div class="error">
                            <h2>❌ 短連結解析失敗</h2>
                            <p>無法解析 b23.tv 短連結，請使用完整的 Bilibili 影片連結</p>
                            <p>例如：https://www.bilibili.com/video/BV1xx411c7mu</p>
                            <p><a href="/" style="color: #4CAF50;">返回首頁</a></p>
                        </div>
                    </body>
                    </html>
                `);
            }
        }
        
        // 檢查是否是有效的 Bilibili 連結（包括解析後的短連結）
        if (processedUrl.includes('bilibili.com') || processedUrl.includes('bvid=') || processedUrl.includes('BV')) {
            // 提取 BV 號和分P
            let bvid = null;
            let p = 1;

            if (processedUrl.includes('/video/')) {
                const match = processedUrl.match(/\/video\/(BV[a-zA-Z0-9]+)/);
                if (match) bvid = match[1];

                const pMatch = processedUrl.match(/[?&]p=(\d+)/);
                if (pMatch) p = parseInt(pMatch[1]);
            } else if (processedUrl.includes('bvid=')) {
                const match = processedUrl.match(/bvid=(BV[a-zA-Z0-9]+)/);
                if (match) bvid = match[1];

                const pMatch = processedUrl.match(/[?&]p=(\d+)/);
                if (pMatch) p = parseInt(pMatch[1]);
            } else if (processedUrl.includes('BV')) {
                // 直接從 URL 中提取 BV 號
                const match = processedUrl.match(/(BV[a-zA-Z0-9]+)/);
                if (match) bvid = match[1];
            }

            if (bvid) {
                // 解析影片並重定向到 1440P 流地址（強制使用 niche 節點）
                return parseAndRedirectToNiche(req, res, bvid);
            }
        }

        // 如果不是有效的 Bilibili 連結，顯示錯誤頁面
        return res.send(`
            <!DOCTYPE html>
            <html lang="zh-TW">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Niche 解析失敗</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; text-align: center; padding: 50px; }
                    .error { background: #333; padding: 20px; border-radius: 8px; border: 2px solid #ff4444; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h1>❌ Niche 解析失敗</h1>
                    <p>請提供有效的 Bilibili 影片連結</p>
                    <p>格式：<code>http://192.168.0.10:3000/niche/?url=https://www.bilibili.com/video/BV1xx411c7mu</code></p>
                    <a href="/" style="color: #00aef0;">返回首頁</a>
                </div>
            </body>
            </html>
        `);
    }
    
    // 如果沒有 URL 參數，顯示 niche 專用頁面
    res.send(`
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Niche 解析工具</title>
            <style>
                body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; text-align: center; padding: 50px; }
                .container { max-width: 600px; margin: 0 auto; }
                .niche-info { background: #333; padding: 30px; border-radius: 15px; border: 2px solid #ffc107; margin-bottom: 20px; }
                .niche-info h1 { color: #ffc107; margin-bottom: 15px; }
                .niche-info p { color: #ccc; line-height: 1.6; }
                .back-link { display: inline-block; padding: 10px 20px; background: #00aef0; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
                .back-link:hover { background: #0088cc; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="niche-info">
                    <h1>🎯 Niche 解析工具</h1>
                    <p>此工具專門使用 <strong>upos-sz-mirror08c.bilivideo.com</strong> 節點進行解析</p>
                    <p>使用方式：<code>/niche/?url=BILIBILI_URL</code></p>
                    <p>適用於需要特定節點解析的場景</p>
                </div>
                <a href="/" class="back-link">返回主頁</a>
            </div>
        </body>
        </html>
    `);
});

// 主頁面路由 - 處理 URL 參數重定向
app.get('/', async (req, res) => {
    const { url } = req.query;
    if (url) {
        // 如果有 URL 參數，重定向到解析結果頁面
        // 嘗試多種方式獲取真實 IP
        let clientIP = req.ip || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress ||
                      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.headers['cf-connecting-ip'] ||
                      'unknown';
        
        // 清理 IPv6 映射的 IPv4 地址
        if (clientIP.startsWith('::ffff:')) {
            clientIP = clientIP.substring(7);
        }
        const userAgent = req.headers['user-agent'] || 'unknown';
        const acceptLanguage = req.headers['accept-language'] || 'unknown';
        const referer = req.headers['referer'] || 'direct';
        const timestamp = new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'});
        const location = getLocationInfo(clientIP);
        
        const startTime = Date.now();
        console.log(`🌐 解析請求: ${url}`);
        console.log(`   請求者: ${clientIP} | 位置: ${location} | 時間: ${timestamp}`);
        console.log(`   瀏覽器: ${userAgent.substring(0, 50)}...`);
        console.log(`   語言: ${acceptLanguage.substring(0, 20)}... | 來源: ${referer.substring(0, 30)}...`);
        console.log(`   ⏱️ 請求開始時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);

        // 檢查是否是 Bilibili 影片連結，支援多種格式
        let processedUrl = url;
        
        // 智能處理各種 URL 格式
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // 如果沒有協議，自動添加 https://
            if (url.startsWith('www.bilibili.com') || url.startsWith('bilibili.com')) {
                processedUrl = 'https://' + url;
            } else if (url.startsWith('BV')) {
                // 如果直接是 BV 號，構建完整 URL
                processedUrl = 'https://www.bilibili.com/video/' + url;
            } else {
                processedUrl = 'https://' + url;
            }
        }
        
        // 檢查是否是 b23.tv 短連結
        if (processedUrl.includes('b23.tv/')) {
            console.log(`🔗 檢測到 b23.tv 短連結，正在解析...`);
            const resolvedUrl = await resolveB23ShortLink(processedUrl);
            if (resolvedUrl) {
                processedUrl = resolvedUrl;
                console.log(`✅ 短連結解析成功: ${resolvedUrl}`);
            } else {
                console.log(`❌ 短連結解析失敗`);
                // 短連結解析失敗，顯示錯誤頁面
                return res.send(`
                    <!DOCTYPE html>
                    <html lang="zh-TW">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>解析失敗</title>
                        <style>
                            body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; text-align: center; padding: 50px; }
                            .error { background: #333; padding: 20px; border-radius: 8px; border: 2px solid #ff4444; }
                        </style>
                    </head>
                    <body>
                        <div class="error">
                            <h2>❌ 短連結解析失敗</h2>
                            <p>無法解析 b23.tv 短連結，請使用完整的 Bilibili 影片連結</p>
                            <p>例如：https://www.bilibili.com/video/BV1xx411c7mu</p>
                            <p><a href="/" style="color: #4CAF50;">返回首頁</a></p>
                        </div>
                    </body>
                    </html>
                `);
            }
        }
        
        // 檢查是否是有效的 Bilibili 連結（包括解析後的短連結）
        if (processedUrl.includes('bilibili.com') || processedUrl.includes('bvid=') || processedUrl.includes('BV')) {
            // 提取 BV 號和分P
            let bvid = null;
            let p = 1;

            if (processedUrl.includes('/video/')) {
                const match = processedUrl.match(/\/video\/(BV[a-zA-Z0-9]+)/);
                if (match) bvid = match[1];

                const pMatch = processedUrl.match(/[?&]p=(\d+)/);
                if (pMatch) p = parseInt(pMatch[1]);
            } else if (processedUrl.includes('bvid=')) {
                const match = processedUrl.match(/bvid=(BV[a-zA-Z0-9]+)/);
                if (match) bvid = match[1];

                const pMatch = processedUrl.match(/[?&]p=(\d+)/);
                if (pMatch) p = parseInt(pMatch[1]);
            } else if (processedUrl.includes('BV')) {
                // 直接從 URL 中提取 BV 號
                const match = processedUrl.match(/(BV[a-zA-Z0-9]+)/);
                if (match) bvid = match[1];
            }

            if (bvid) {
                // 直接導向到解析結果
                return parseAndRedirectTo1440P(req, res, bvid);
            } else {
                // 如果是 Bilibili 連結但沒有找到 BV 號，顯示錯誤
                return res.send(`
                    <!DOCTYPE html>
                    <html lang="zh-TW">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>解析失敗</title>
                        <style>
                            body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; text-align: center; padding: 50px; }
                            .error { background: #333; padding: 20px; border-radius: 8px; border: 2px solid #ff4444; }
                        </style>
                    </head>
                    <body>
                        <div class="error">
                            <h2>❌ 解析失敗</h2>
                            <p>請提供完整的 Bilibili 影片連結，包含 BV 號</p>
                            <p>例如：https://www.bilibili.com/video/BV1xx411c7mu</p>
                            <p><a href="/" style="color: #4CAF50;">返回首頁</a></p>
                        </div>
                    </body>
                    </html>
                `);
            }
        }


        // 如果不是有效的 Bilibili 連結，顯示錯誤頁面
        return res.send(`
            <!DOCTYPE html>
            <html lang="zh-TW">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>解析失敗</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; text-align: center; padding: 50px; }
                    .error { background: #333; padding: 20px; border-radius: 8px; border: 2px solid #ff4444; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h1>❌ 解析失敗</h1>
                    <p>請提供有效的 Bilibili 影片連結</p>
                    <p>格式：<code>http://192.168.0.10:3000/?url=https://www.bilibili.com/video/BV1xx411c7mu</code></p>
                    <a href="/" style="color: #00aef0;">返回首頁</a>
                </div>
            </body>
            </html>
        `);
    }
    
    // 如果沒有 URL 參數，正常顯示主頁面
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API 端點 - 解析 b23.tv 短連結
app.get('/api/parse/shortlink', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.json({
            success: false,
            message: '請提供 URL 參數'
        });
    }
    
    try {
        console.log(`🔗 解析短連結請求: ${url}`);
        
        // 檢查是否是 b23.tv 短連結
        if (!url.includes('b23.tv/')) {
            return res.json({
                success: false,
                message: '不是有效的 b23.tv 短連結'
            });
        }
        
        // 解析短連結
        const fullUrl = await resolveB23ShortLink(url);
        
        if (fullUrl) {
            console.log(`✅ 短連結解析成功: ${fullUrl}`);
            return res.json({
                success: true,
                fullUrl: fullUrl,
                originalUrl: url
            });
        } else {
            console.log(`❌ 短連結解析失敗: ${url}`);
            return res.json({
                success: false,
                message: '無法解析短連結，請檢查 URL 是否正確'
            });
        }
    } catch (error) {
        console.error('❌ 解析短連結錯誤:', error);
        return res.json({
            success: false,
            message: '解析短連結時發生錯誤: ' + error.message
        });
    }
});

// API 端點 - 影片解析
app.get('/api/parse/video/:bvid', async (req, res) => {
    const { bvid } = req.params;
    const useMirror = req.query.mirror === 'true';
    
    try {
        // 嘗試多種方式獲取真實 IP
        let clientIP = req.ip || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress ||
                      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.headers['cf-connecting-ip'] ||
                      'unknown';
        
        // 清理 IPv6 映射的 IPv4 地址
        if (clientIP.startsWith('::ffff:')) {
            clientIP = clientIP.substring(7);
        }
        const userAgent = req.headers['user-agent'] || 'unknown';
        const acceptLanguage = req.headers['accept-language'] || 'unknown';
        const referer = req.headers['referer'] || 'direct';
        const timestamp = new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'});
        const location = getLocationInfo(clientIP);
        
        console.log(`🎬 解析影片: ${bvid}${useMirror ? ' (Mirror 節點)' : ''}`);
        console.log(`   請求者: ${clientIP} | 位置: ${location} | 時間: ${timestamp}`);
        console.log(`   瀏覽器: ${userAgent.substring(0, 50)}...`);
        console.log(`   語言: ${acceptLanguage.substring(0, 20)}... | 來源: ${referer.substring(0, 30)}...`);
        
        // 獲取影片資訊
        const videoInfoResponse = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/'
            }
        });
        
        if (videoInfoResponse.data.code === 0) {
            const videoData = videoInfoResponse.data.data;
            const cid = videoData.cid;
            const title = videoData.title;
            
            // 嘗試獲取 1440P 清晰度的流地址
            const qualityRequests = [
                { qn: 112, name: '1440P', desc: '2K超高清' }
            ];
            
            const streamPromises = qualityRequests.map(async (quality) => {
                try {
                    console.log(`正在獲取 ${quality.name} 流地址...`);                    
                    // 嘗試多種方法獲取流地址
                    const methods = [
                        // 方法1：使用 platform=html5 繞過防盜鏈
                        {
                            url: `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=${quality.qn}&fnval=16&platform=html5`,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Referer': 'https://www.bilibili.com/',
                                'Accept': 'application/json, text/plain, */*',
                                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                                'Accept-Encoding': 'gzip, deflate, br',
                                'Connection': 'keep-alive',
                                'Sec-Fetch-Dest': 'empty',
                                'Sec-Fetch-Mode': 'cors',
                                'Sec-Fetch-Site': 'same-site'
                            }
                        },
                        // 方法2：標準請求
                        {
                            url: `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=${quality.qn}&fnval=16`,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Referer': 'https://www.bilibili.com/',
                                'Accept': 'application/json, text/plain, */*',
                                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                                'Accept-Encoding': 'gzip, deflate, br',
                                'Connection': 'keep-alive',
                                'Sec-Fetch-Dest': 'empty',
                                'Sec-Fetch-Mode': 'cors',
                                'Sec-Fetch-Site': 'same-site'
                            }
                        }
                    ];
                    
                    let lastError = null;
                    for (const method of methods) {
                        try {
                            const response = await axios.get(method.url, {
                                headers: method.headers,
                                timeout: 10000
                            });
                            console.log(`${quality.name} 獲取成功 (方法: ${method.url.includes('platform=html5') ? 'html5' : '標準'})`);
                            return { quality, response };
                        } catch (error) {
                            lastError = error;
                            console.log(`${quality.name} 方法失敗:`, error.response?.status);
                            continue;
                        }
                    }
                    
                    throw lastError;
                } catch (error) {
                    console.log(`獲取 ${quality.name} 失敗:`, error.response?.status, error.message);
                    return { quality, response: null, error: error.response?.status };
                }
            });
            
            const streamResults = await Promise.all(streamPromises);
            
            const results = [];
            
            // 添加影片資訊
            results.push({
                title: '影片標題',
                url: `https://www.bilibili.com/video/${bvid}`,
                type: 'info',
                description: title
            });
            
            // 解析多種清晰度的流地址
            for (const { quality, response, error } of streamResults) {
                if (response && response.data.code === 0) {
                    const streamData = response.data.data;
                    
                    if (streamData.durl && streamData.durl.length > 0) {
                        // FLV 格式 - 根據參數選擇節點
                        const selectedMainNode = useMirror ? 'upos-sz-mirror08c.bilivideo.com' : await getBestAvailableNode(bvid);
                        
                        for (const item of streamData.durl) {
                            const originalUrl = item.url;
                            
                            // 替換所有CDN節點
                            let newUrl = originalUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-bj-[^/]+\.bilivideo\.com/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-hz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            
                            // 替換 akamaized.net 節點
                            newUrl = newUrl.replace(/upos-sz-[^/]+\.akamaized\.net/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-bj-[^/]+\.akamaized\.net/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, selectedMainNode);
                            
                            // 總是添加主節點地址，並根據節點類型顯示不同描述
                            const nodeDescription = selectedMainNode === 'upos-sz-mirror08c.bilivideo.com' 
                                ? `栖隙居所適配 - ${quality.name} ${quality.desc} (已繞過防盜鏈)`
                                : `主CDN節點: ${selectedMainNode} - ${quality.name} ${quality.desc} (已繞過防盜鏈) 請複製我!`;
                            
                            results.push({
                                title: `${quality.name} FLV 流地址 (主節點)`,
                                url: newUrl,
                                type: 'stream',
                                description: nodeDescription
                            });
                            
                            // 添加原始地址
                            results.push({
                                title: `${quality.name} FLV 流地址 (原始)`,
                                url: originalUrl,
                                type: 'stream',
                                description: `直接 FLV 流地址 - ${quality.name} ${quality.desc} (已繞過防盜鏈)`
                            });
                        }
                    }
                    
                    if (streamData.dash && streamData.dash.video) {
                        // DASH 格式 - 根據參數選擇節點
                        const selectedMainNode = useMirror ? 'upos-sz-mirror08c.bilivideo.com' : await getBestAvailableNode(bvid);
                        
                        for (const item of streamData.dash.video) {
                            const originalUrl = item.baseUrl;
                            
                            // 替換所有CDN節點
                            let newUrl = originalUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-bj-[^/]+\.bilivideo\.com/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-hz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            
                            // 替換 akamaized.net 節點
                            newUrl = newUrl.replace(/upos-sz-[^/]+\.akamaized\.net/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-bj-[^/]+\.akamaized\.net/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, selectedMainNode);
                            
                            // 總是添加主節點地址，並根據節點類型顯示不同描述
                            const nodeDescription = selectedMainNode === 'upos-sz-mirror08c.bilivideo.com' 
                                ? `栖隙居所適配 - ${quality.name} ${quality.desc} (已繞過防盜鏈)`
                                : `主CDN節點: ${selectedMainNode} - ${quality.name} ${quality.desc} (已繞過防盜鏈) 請複製我!`;
                            
                            results.push({
                                title: `${quality.name} DASH 視頻流 (主節點)`,
                                url: newUrl,
                                type: 'stream',
                                description: nodeDescription
                            });
                            
                            // 添加原始地址
                            results.push({
                                title: `${quality.name} DASH 視頻流 (原始)`,
                                url: originalUrl,
                                type: 'stream',
                                description: `直接 DASH 視頻流 - ${quality.name} ${quality.desc} (已繞過防盜鏈)`
                            });
                        }
                    }
                    
                    if (streamData.dash && streamData.dash.audio) {
                        // DASH 音頻 - 根據參數選擇節點
                        const selectedMainNode = useMirror ? 'upos-sz-mirror08c.bilivideo.com' : await getBestAvailableNode(bvid);
                        
                        for (const item of streamData.dash.audio) {
                            const originalUrl = item.baseUrl;
                            
                            // 替換所有CDN節點
                            let newUrl = originalUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-bj-[^/]+\.bilivideo\.com/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-hz-[^/]+\.bilivideo\.com/, selectedMainNode);
                            
                            // 替換 akamaized.net 節點
                            newUrl = newUrl.replace(/upos-sz-[^/]+\.akamaized\.net/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-bj-[^/]+\.akamaized\.net/, selectedMainNode);
                            newUrl = newUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, selectedMainNode);
                            
                            // 總是添加主節點地址，並根據節點類型顯示不同描述
                                const nodeDescription = selectedMainNode === 'upos-sz-mirror08c.bilivideo.com' 
                                    ? `栖隙居所適配 - 高品質音頻 (已繞過防盜鏈)`
                                    : `主CDN節點: ${selectedMainNode} - 高品質音頻 (已繞過防盜鏈) 請複製我!`;
                            
                            results.push({
                                title: `${quality.name} DASH 音頻流 (主節點)`,
                                url: newUrl,
                                type: 'stream',
                                description: nodeDescription
                            });
                            
                            // 添加原始地址
                            results.push({
                                title: `${quality.name} DASH 音頻流 (原始)`,
                                url: originalUrl,
                                type: 'stream',
                                description: `直接 DASH 音頻流 - 高品質音頻 (已繞過防盜鏈)`
                            });
                        }
                    }
                } else {
                    // 如果某個清晰度獲取失敗，添加詳細的錯誤提示
                    let errorMsg = '獲取失敗';
                    if (error === 403) {
                        errorMsg = '403 禁止訪問 - 可能需要登錄或該清晰度不可用';
                    } else if (error === 404) {
                        errorMsg = '404 未找到 - 該清晰度不存在';
                    } else if (error === 429) {
                        errorMsg = '429 請求過於頻繁 - 請稍後再試';
                    } else if (error) {
                        errorMsg = `HTTP ${error} 錯誤`;
                    }
                    
                    results.push({
                        title: `${quality.name} 流地址`,
                        url: `https://www.bilibili.com/video/${bvid}`,
                        type: 'info',
                        description: `${quality.name} ${quality.desc} - ${errorMsg}`
                    });
                }
            }
            
            res.json({
                success: true,
                data: results
            });
        } else {
            res.json({
                success: false,
                error: '獲取影片資訊失敗'
            });
        }
    } catch (error) {
        console.error('影片解析錯誤:', error);
        res.json({
            success: false,
            error: '解析失敗'
        });
    }
});



// 獲取服務計數器資訊的 API
app.get('/api/counters', (req, res) => {
    try {
        const counters = getCounters();
        res.json({
            success: true,
            data: counters
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '獲取計數器資訊失敗'
        });
    }
});

// 獲取節點狀態資訊的 API
app.get('/api/nodes', (req, res) => {
    try {
        const nodes = Object.keys(nodeStatus).map(node => {
            const status = nodeStatus[node];
            const totalAttempts = status.successCount + status.failCount;
            const successRate = totalAttempts > 0 ? (status.successCount / totalAttempts * 100).toFixed(1) : 0;
            
            return {
                node,
                region: status.region || '未知',
                available: status.available,
                lastCheck: new Date(status.lastCheck).toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'}),
                successCount: status.successCount,
                failCount: status.failCount,
                successRate: `${successRate}%`,
                totalAttempts
            };
        });
        
        res.json({
            success: true,
            data: {
                nodes,
                totalNodes: nodes.length,
                availableNodes: nodes.filter(n => n.available).length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '獲取節點狀態失敗'
        });
    }
});

// 提供靜態文件（放在主頁面路由之後）
app.use(express.static('.'));

// 啟動服務器
app.listen(PORT, () => {
    console.log(`🚀 VRC Bilibili 解析服務器已啟動`);
    console.log(`📍 本地地址: http://localhost:${PORT}`);
    console.log(`🌐 網路地址: http://0.0.0.0:${PORT}`);
    console.log(`🌍 正式網址: https://vrcbilibili.xn--o8z.tw/`);
    console.log(`💡 使用方式: https://vrcbilibili.xn--o8z.tw/?url=BILIBILI_URL`);
});