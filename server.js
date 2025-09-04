const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// 配置 Express 來獲取真實 IP 地址
app.set('trust proxy', true);

// 解析並重定向到 720P 流地址的函數
async function parseAndRedirectTo720P(req, res, bvid) {
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
        
        console.log(`🔄 重定向解析: ${bvid}`);
        console.log(`   請求者: ${clientIP} | 時間: ${timestamp}`);
        console.log(`   瀏覽器: ${userAgent.substring(0, 50)}...`);
        console.log(`   語言: ${acceptLanguage.substring(0, 20)}... | 來源: ${referer.substring(0, 30)}...`);
        console.log(`   IP 調試: req.ip=${req.ip}, remoteAddress=${req.connection?.remoteAddress}, x-forwarded-for=${req.headers['x-forwarded-for']}`);
        
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
            
            // 只嘗試獲取 720P 流地址
            const streamResponse = await axios.get(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=64&fnval=16&platform=html5`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.bilibili.com/'
                }
            });
            
            if (streamResponse.data.code === 0) {
                const streamData = streamResponse.data.data;
                // 優先選擇 DASH 格式的 720P 視頻流
                if (streamData.dash && streamData.dash.video) {
                    const dash720P = streamData.dash.video.find(item => item.id === 64);
                    if (dash720P) {
                        // 將所有CDN節點替換為主節點
                        let mainNodeUrl = dash720P.baseUrl;
                        mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, 'upos-sz-estgoss.bilivideo.com');
                        mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, 'upos-sz-estgoss.bilivideo.com');
                        mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.bilivideo\.com/, 'upos-sz-estgoss.bilivideo.com');
                        mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.akamaized\.net/, 'upos-sz-estgoss.bilivideo.com');
                        mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.cloudfront\.net/, 'upos-sz-estgoss.bilivideo.com');
                        
                        console.log(`✅ 解析成功 | 格式: DASH | 時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
                        return res.redirect(mainNodeUrl);
                    }
                }
                
                // 如果沒有 DASH，選擇 FLV 格式
                if (streamData.durl && streamData.durl.length > 0) {
                    // 將所有CDN節點替換為主節點
                    let mainNodeUrl = streamData.durl[0].url;
                    mainNodeUrl = mainNodeUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, 'upos-sz-estgoss.bilivideo.com');
                    mainNodeUrl = mainNodeUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, 'upos-sz-estgoss.bilivideo.com');
                    mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.bilivideo\.com/, 'upos-sz-estgoss.bilivideo.com');
                    mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.akamaized\.net/, 'upos-sz-estgoss.bilivideo.com');
                    mainNodeUrl = mainNodeUrl.replace(/upos-[^/]+-[^/]+\.cloudfront\.net/, 'upos-sz-estgoss.bilivideo.com');
                    
                    console.log(`✅ 解析成功 | 格式: FLV | 時間: ${new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'})}`);
                    return res.redirect(mainNodeUrl);
                }
            }
        }
        
        // 如果解析失敗，重定向到原始 Bilibili 頁面
        console.log(`❌ 解析失敗: ${bvid}`);
        return res.redirect(`https://www.bilibili.com/video/${bvid}`);
        
    } catch (error) {
        console.error(`❌ 解析重定向錯誤: ${bvid} - ${error.message}`);
        // 錯誤時重定向到原始 Bilibili 頁面
        return res.redirect(`https://www.bilibili.com/video/${bvid}`);
    }
}

// 主頁面路由 - 處理 URL 參數重定向
app.get('/', (req, res) => {
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
        
        console.log(`🌐 解析請求: ${url}`);
        console.log(`   請求者: ${clientIP} | 時間: ${timestamp}`);
        console.log(`   瀏覽器: ${userAgent.substring(0, 50)}...`);
        console.log(`   語言: ${acceptLanguage.substring(0, 20)}... | 來源: ${referer.substring(0, 30)}...`);

        // 檢查是否是 Bilibili 影片連結
        if (url.includes('bilibili.com/video/') || url.includes('bvid=')) {
            // 提取 BV 號和分P
            let bvid = null;
            let p = 1;

            if (url.includes('/video/')) {
                const match = url.match(/\/video\/(BV[a-zA-Z0-9]+)/);
                if (match) bvid = match[1];

                const pMatch = url.match(/[?&]p=(\d+)/);
                if (pMatch) p = parseInt(pMatch[1]);
            } else if (url.includes('bvid=')) {
                const match = url.match(/bvid=(BV[a-zA-Z0-9]+)/);
                if (match) bvid = match[1];

                const pMatch = url.match(/[?&]p=(\d+)/);
                if (pMatch) p = parseInt(pMatch[1]);
            }

            if (bvid) {
                // 解析影片並重定向到 720P 流地址
                return parseAndRedirectTo720P(req, res, bvid);
            }
        }

        // 檢查是否是 Bilibili 直播連結
        if (url.includes('live.bilibili.com')) {
            const match = url.match(/live\.bilibili\.com\/(\d+)/);
            if (match) {
                const roomId = match[1];
                // 直播暫時重定向到代理頁面
                return res.redirect(`/proxy?url=${encodeURIComponent(url)}`);
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
                    <p>請提供有效的 Bilibili 影片或直播連結</p>
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

// API 端點 - 影片解析
app.get('/api/parse/video/:bvid', async (req, res) => {
    const { bvid } = req.params;
    
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
        
        console.log(`🎬 解析影片: ${bvid}`);
        console.log(`   請求者: ${clientIP} | 時間: ${timestamp}`);
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
            
            // 只獲取 720P 清晰度的流地址
            const qualityRequests = [
                { qn: 64, name: '720P', desc: '高清' }
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
            streamResults.forEach(({ quality, response, error }) => {
                if (response && response.data.code === 0) {
                    const streamData = response.data.data;
                    
                    if (streamData.durl && streamData.durl.length > 0) {
                        // FLV 格式 - 只使用最大的CDN節點
                        const cdnNodes = [
                            'upos-sz-estgoss.bilivideo.com'
                        ];
                        
                        streamData.durl.forEach((item, index) => {
                            const originalUrl = item.url;
                            
                            // 將所有CDN節點替換為最大的主節點
                            cdnNodes.forEach(cdnNode => {
                                // 替換各種可能的CDN節點格式
                                let newUrl = originalUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, cdnNode);
                                newUrl = newUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, cdnNode);
                                newUrl = newUrl.replace(/upos-[^/]+-[^/]+\.bilivideo\.com/, cdnNode);
                                newUrl = newUrl.replace(/upos-[^/]+-[^/]+\.akamaized\.net/, cdnNode);
                                newUrl = newUrl.replace(/upos-[^/]+-[^/]+\.cloudfront\.net/, cdnNode);
                                if (newUrl !== originalUrl) {
                                    results.push({
                                        title: `${quality.name} FLV 流地址 (主節點)`,
                                        url: newUrl,
                                        type: 'stream',
                                        description: `主CDN節點: ${cdnNode} - ${quality.name} ${quality.desc} (已繞過防盜鏈)`
                                    });
                                }
                            });
                            
                            // 添加原始地址
                            results.push({
                                title: `${quality.name} FLV 流地址 (原始)`,
                                url: originalUrl,
                                type: 'stream',
                                description: `直接 FLV 流地址 - ${quality.name} ${quality.desc} (已繞過防盜鏈)`
                            });
                        });
                    }
                    
                    if (streamData.dash && streamData.dash.video) {
                        // DASH 格式 - 只使用最大的CDN節點
                        const cdnNodes = [
                            'upos-sz-estgoss.bilivideo.com'
                        ];
                        
                        streamData.dash.video.forEach((item, index) => {
                            const originalUrl = item.baseUrl;
                            
                            // 將所有CDN節點替換為最大的主節點
                            cdnNodes.forEach(cdnNode => {
                                // 替換各種可能的CDN節點格式
                                let newUrl = originalUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, cdnNode);
                                newUrl = newUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, cdnNode);
                                newUrl = newUrl.replace(/upos-[^/]+-[^/]+\.bilivideo\.com/, cdnNode);
                                newUrl = newUrl.replace(/upos-[^/]+-[^/]+\.akamaized\.net/, cdnNode);
                                newUrl = newUrl.replace(/upos-[^/]+-[^/]+\.cloudfront\.net/, cdnNode);
                                
                                if (newUrl !== originalUrl) {
                                    results.push({
                                        title: `${quality.name} DASH 視頻流 (主節點)`,
                                        url: newUrl,
                                        type: 'stream',
                                        description: `主CDN節點: ${cdnNode} - ${quality.name} ${quality.desc} (已繞過防盜鏈)`
                                    });
                                }
                            });
                            
                            // 添加原始地址
                            results.push({
                                title: `${quality.name} DASH 視頻流 (原始)`,
                                url: originalUrl,
                                type: 'stream',
                                description: `直接 DASH 視頻流 - ${quality.name} ${quality.desc} (已繞過防盜鏈)`
                            });
                        });
                    }
                    
                    if (streamData.dash && streamData.dash.audio) {
                        // DASH 音頻 - 只使用最大的CDN節點
                        const cdnNodes = [
                            'upos-sz-estgoss.bilivideo.com'
                        ];
                        
                        streamData.dash.audio.forEach((item, index) => {
                            const originalUrl = item.baseUrl;
                            
                            // 將所有CDN節點替換為最大的主節點
                            cdnNodes.forEach(cdnNode => {
                                // 替換各種可能的CDN節點格式
                                let newUrl = originalUrl.replace(/upos-sz-[^/]+\.bilivideo\.com/, cdnNode);
                                newUrl = newUrl.replace(/upos-hz-[^/]+\.akamaized\.net/, cdnNode);
                                newUrl = newUrl.replace(/upos-[^/]+-[^/]+\.bilivideo\.com/, cdnNode);
                                newUrl = newUrl.replace(/upos-[^/]+-[^/]+\.akamaized\.net/, cdnNode);
                                newUrl = newUrl.replace(/upos-[^/]+-[^/]+\.cloudfront\.net/, cdnNode);
                                
                                if (newUrl !== originalUrl) {
                                    results.push({
                                        title: `${quality.name} DASH 音頻流 (主節點)`,
                                        url: newUrl,
                                        type: 'stream',
                                        description: `主CDN節點: ${cdnNode} - 高品質音頻 (已繞過防盜鏈)`
                                    });
                                }
                            });
                            
                            // 添加原始地址
                            results.push({
                                title: `${quality.name} DASH 音頻流 (原始)`,
                                url: originalUrl,
                                type: 'stream',
                                description: `直接 DASH 音頻流 - 高品質音頻 (已繞過防盜鏈)`
                            });
                        });
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
            });
            
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

// API 端點 - 直播解析
app.get('/api/parse/live/:roomId', async (req, res) => {
    const { roomId } = req.params;
    
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
        
        console.log(`📺 解析直播: ${roomId}`);
        console.log(`   請求者: ${clientIP} | 時間: ${timestamp}`);
        console.log(`   瀏覽器: ${userAgent.substring(0, 50)}...`);
        console.log(`   語言: ${acceptLanguage.substring(0, 20)}... | 來源: ${referer.substring(0, 30)}...`);
        
        // 獲取直播資訊
        const liveInfoResponse = await axios.get(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${roomId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://live.bilibili.com/'
            }
        });
        
        if (liveInfoResponse.data.code === 0) {
            const liveData = liveInfoResponse.data.data;
            const title = liveData.room_info?.title || '直播間';
            
            // 獲取直播流地址
            const streamResponse = await axios.get(`https://api.live.bilibili.com/room/v1/Room/playUrl?cid=${roomId}&quality=4&platform=web`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://live.bilibili.com/'
                }
            });
            
            const results = [];
            
            // 添加直播資訊
            results.push({
                title: '直播標題',
                url: `https://live.bilibili.com/${roomId}`,
                type: 'info',
                description: title
            });
            
            // 解析直播流地址
            if (streamResponse.data.code === 0) {
                const streamData = streamResponse.data.data;
                
                if (streamData.durl && streamData.durl.length > 0) {
                    streamData.durl.forEach((item, index) => {
                        results.push({
                            title: `直播流地址 ${index + 1}`,
                            url: item.url,
                            type: 'stream',
                            description: `直接直播流地址 - 清晰度 ${index + 1}`
                        });
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
                error: '獲取直播資訊失敗'
            });
        }
    } catch (error) {
        console.error('直播解析錯誤:', error);
        res.json({
            success: false,
            error: '解析失敗'
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