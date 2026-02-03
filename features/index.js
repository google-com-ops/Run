const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

// Token bot
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN is required!');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Middleware
app.use(express.json());

// Server list LENGKAP 20 negara
const SERVERS = [
    { code: 'us', country: 'USA', emoji: '🇺🇸', city: 'New York', timeout: 3000 },
    { code: 'gb', country: 'UK', emoji: '🇬🇧', city: 'London', timeout: 3000 },
    { code: 'jp', country: 'Japan', emoji: '🇯🇵', city: 'Tokyo', timeout: 4000 },
    { code: 'de', country: 'Germany', emoji: '🇩🇪', city: 'Frankfurt', timeout: 3000 },
    { code: 'ch', country: 'Switzerland', emoji: '🇨🇭', city: 'Zurich', timeout: 3000 },
    { code: 'ru', country: 'Russia', emoji: '🇷🇺', city: 'Moscow', timeout: 4000 },
    { code: 'ca', country: 'Canada', emoji: '🇨🇦', city: 'Toronto', timeout: 3000 },
    { code: 'se', country: 'Sweden', emoji: '🇸🇪', city: 'Stockholm', timeout: 3000 },
    { code: 'sg', country: 'Singapore', emoji: '🇸🇬', city: 'Singapore', timeout: 2000 },
    { code: 'in', country: 'India', emoji: '🇮🇳', city: 'Mumbai', timeout: 4000 },
    { code: 'br', country: 'Brazil', emoji: '🇧🇷', city: 'Sao Paulo', timeout: 4000 },
    { code: 'fr', country: 'France', emoji: '🇫🇷', city: 'Paris', timeout: 3000 },
    { code: 'au', country: 'Australia', emoji: '🇦🇺', city: 'Sydney', timeout: 4000 },
    { code: 'kr', country: 'South Korea', emoji: '🇰🇷', city: 'Seoul', timeout: 3000 },
    { code: 'id', country: 'Indonesia', emoji: '🇮🇩', city: 'Jakarta', timeout: 2000 },
    { code: 'vn', country: 'Vietnam', emoji: '🇻🇳', city: 'Hanoi', timeout: 2000 },
    { code: 'tr', country: 'Turkey', emoji: '🇹🇷', city: 'Istanbul', timeout: 3000 },
    { code: 'nl', country: 'Netherlands', emoji: '🇳🇱', city: 'Amsterdam', timeout: 3000 },
    { code: 'it', country: 'Italy', emoji: '🇮🇹', city: 'Milan', timeout: 3000 },
    { code: 'es', country: 'Spain', emoji: '🇪🇸', city: 'Madrid', timeout: 3000 }
];

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Format URL
function formatUrl(url) {
    if (!url) return 'http://invalid.url';
    url = url.trim().toLowerCase();
    url = url.replace(/^https?:\/\//i, '');
    url = url.replace(/^www\./i, '');
    return 'http://' + url;
}

// Fungsi check server LENGKAP dengan semua error detection
async function checkServer(url, server) {
    const start = Date.now();
    
    try {
        const response = await axios({
            method: 'HEAD',
            url: url,
            timeout: server.timeout || 3000,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Connection': 'close'
            },
            validateStatus: () => true,
            httpAgent: false,
            httpsAgent: false
        });
        
        const time = Date.now() - start;
        
        // Cek redirect
        let finalUrl = url;
        let isRedirect = false;
        let redirectCount = 0;
        
        if (response.request?.res?.responseUrl) {
            finalUrl = response.request.res.responseUrl;
            if (finalUrl !== url) {
                isRedirect = true;
                redirectCount = response.request._redirectable?._redirectCount || 0;
            }
        }
        
        return {
            success: true,
            server: server,
            code: response.status,
            time: time,
            status: response.statusText || 'OK',
            isRedirect: isRedirect,
            redirectCount: redirectCount,
            finalUrl: finalUrl,
            headers: response.headers
        };
        
    } catch (error) {
        const time = Date.now() - start;
        let statusCode = 0;
        let statusText = 'Unknown Error';
        
        // Deteksi semua jenis error LENGKAP
        if (error.code === 'ECONNABORTED') {
            statusCode = 599;
            statusText = 'Timeout';
        } else if (error.code === 'ECONNREFUSED') {
            statusCode = 503;
            statusText = 'Connection Refused';
        } else if (error.code === 'ECONNRESET') {
            statusCode = 502;
            statusText = 'Connection Reset';
        } else if (error.code === 'ETIMEDOUT') {
            statusCode = 504;
            statusText = 'Connection Timeout';
        } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
            statusCode = 502;
            statusText = 'DNS Error';
        } else if (error.code === 'EPIPE' || error.code === 'ERR_STREAM_DESTROYED') {
            statusCode = 508;
            statusText = 'Broken Pipe';
        } else if (error.code === 'CERT_HAS_EXPIRED') {
            statusCode = 526;
            statusText = 'SSL Expired';
        } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
            statusCode = 525;
            statusText = 'SSL Handshake Failed';
        } else if (error.code === 'EHOSTUNREACH') {
            statusCode = 503;
            statusText = 'Host Unreachable';
        } else if (error.code === 'ENETUNREACH') {
            statusCode = 503;
            statusText = 'Network Unreachable';
        } else if (error.code === 'EADDRNOTAVAIL') {
            statusCode = 503;
            statusText = 'Address Not Available';
        } else if (error.code === 'ECONNRESET') {
            statusCode = 502;
            statusText = 'Connection Reset By Peer';
        } else if (error.response) {
            statusCode = error.response.status;
            statusText = 'Server Error';
        } else if (error.request) {
            statusCode = 502;
            statusText = 'No Response';
        } else {
            statusCode = 500;
            statusText = error.message || 'Connection Failed';
        }
        
        return {
            success: false,
            server: server,
            code: statusCode,
            time: time,
            status: statusText,
            isRedirect: false,
            redirectCount: 0
        };
    }
}

// Get status message dengan semua kode HTTP
function getStatusMsg(code, isRedirect = false) {
    if (isRedirect) return 'Redirected';
    if (code === 0) return 'Connection Failed';
    if (code === 599) return 'Timeout';
    if (code === 502) return 'Bad Gateway';
    if (code === 503) return 'Service Unavailable';
    if (code === 504) return 'Gateway Timeout';
    if (code === 508) return 'Broken Pipe';
    if (code === 525) return 'SSL Handshake Failed';
    if (code === 526) return 'SSL Expired';
    
    // Kode redirect
    if (code === 301) return 'Permanent Redirect';
    if (code === 302) return 'Temporary Redirect';
    if (code === 303) return 'See Other';
    if (code === 307) return 'Temporary Redirect';
    if (code === 308) return 'Permanent Redirect';
    
    // Kode client error
    if (code === 400) return 'Bad Request';
    if (code === 401) return 'Unauthorized';
    if (code === 403) return 'Forbidden';
    if (code === 404) return 'Not Found';
    if (code === 405) return 'Method Not Allowed';
    if (code === 408) return 'Request Timeout';
    if (code === 429) return 'Too Many Requests';
    if (code === 451) return 'Unavailable For Legal Reasons';
    
    // Kode server error
    if (code === 500) return 'Internal Server Error';
    if (code === 501) return 'Not Implemented';
    if (code === 502) return 'Bad Gateway';
    if (code === 503) return 'Service Unavailable';
    if (code === 504) return 'Gateway Timeout';
    if (code === 505) return 'HTTP Version Not Supported';
    if (code === 511) return 'Network Authentication Required';
    
    // Group based on ranges
    if (code >= 100 && code < 200) return 'Informational';
    if (code >= 200 && code < 300) return 'Success';
    if (code >= 300 && code < 400) return 'Redirect';
    if (code >= 400 && code < 500) return 'Client Error';
    if (code >= 500 && code < 600) return 'Server Error';
    
    return 'Unknown Status';
}

// Format hasil dengan detail lengkap
function formatResultsHTML(data) {
    const { url, results } = data;
    
    let message = `<b>🌐 HTTP Check Results</b>\n`;
    message += `<code>${escapeHtml(url)}</code>\n\n`;
    
    // Kelompokkan hasil
    const success = results.filter(r => r.code >= 200 && r.code < 300).length;
    const redirects = results.filter(r => r.code >= 300 && r.code < 400).length;
    const clientErrors = results.filter(r => r.code >= 400 && r.code < 500).length;
    const serverErrors = results.filter(r => r.code >= 500 || r.code === 0 || r.code === 599 || r.code === 508).length;
    
    // Show top 10 results
    const sortedResults = [...results].sort((a, b) => {
        if (a.success && !b.success) return -1;
        if (!a.success && b.success) return 1;
        return a.time - b.time;
    });
    
    const displayResults = sortedResults.slice(0, 10);
    
    message += `<b>📊 Quick Overview:</b>\n`;
    displayResults.forEach(result => {
        const { server, code, time, isRedirect } = result;
        
        // Icon berdasarkan status
        let icon = '❓';
        if (code >= 200 && code < 300) icon = '✅';
        else if (code >= 300 && code < 400) icon = '↪️';
        else if (code >= 400 && code < 500) icon = '⚠️';
        else if (code >= 500 || code === 0 || code === 599 || code === 508) icon = '❌';
        
        // Format code
        let codeDisplay = code.toString();
        if (code === 0) codeDisplay = 'ERR';
        if (code === 599) codeDisplay = 'TO';
        if (code === 508) codeDisplay = 'BP';
        if (code === 525) codeDisplay = 'SSL';
        if (code === 526) codeDisplay = 'SSL-E';
        
        message += `${icon} ${server.emoji} <b>${server.city}</b> » ${codeDisplay} - ${time}ms\n`;
    });
    
    // Statistics
    message += `\n<b>📈 Statistics:</b>\n`;
    message += `✅ Success: <b>${success}</b>\n`;
    message += `↪️ Redirects: <b>${redirects}</b>\n`;
    message += `⚠️ Client Errors: <b>${clientErrors}</b>\n`;
    message += `❌ Server Errors: <b>${serverErrors}</b>\n`;
    message += `🌍 Total: <b>${results.length}</b> servers\n`;
    
    // Error details
    const criticalErrors = results.filter(r => 
        r.code === 0 || r.code === 599 || r.code === 508 || 
        r.code === 525 || r.code === 526 || r.code >= 500
    );
    
    if (criticalErrors.length > 0) {
        message += `\n<b>🚨 Critical Issues:</b>\n`;
        criticalErrors.slice(0, 5).forEach(error => {
            const statusMsg = getStatusMsg(error.code, error.isRedirect);
            message += `• ${error.server.emoji} ${error.server.city}: ${statusMsg} (${error.code})\n`;
        });
        if (criticalErrors.length > 5) {
            message += `• ...and ${criticalErrors.length - 5} more\n`;
        }
    }
    
    // Redirect analysis
    const redirectResults = results.filter(r => r.isRedirect || (r.code >= 300 && r.code < 400));
    if (redirectResults.length > 0) {
        message += `\n<b>🔄 Redirect Analysis:</b>\n`;
        redirectResults.slice(0, 3).forEach(redirect => {
            message += `• ${redirect.server.emoji} ${redirect.server.city}: ${redirect.redirectCount} redirect(s)\n`;
        });
    }
    
    // Response time analysis
    const successfulTimes = results.filter(r => r.code >= 200 && r.code < 300).map(r => r.time);
    if (successfulTimes.length > 0) {
        const avgTime = Math.round(successfulTimes.reduce((a, b) => a + b, 0) / successfulTimes.length);
        const minTime = Math.min(...successfulTimes);
        const maxTime = Math.max(...successfulTimes);
        message += `\n<b>⏱️ Response Time:</b>\n`;
        message += `• Average: <b>${avgTime}ms</b>\n`;
        message += `• Fastest: <b>${minTime}ms</b>\n`;
        message += `• Slowest: <b>${maxTime}ms</b>\n`;
    }
    
    // Check-Host link
    const checkUrl = `https://check-host.net/check-http?host=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
    message += `\n<b>🔗 Full Report:</b> <a href="${checkUrl}">Check-Host.net</a>`;
    
    return message;
}

// Store data
const userData = new Map();

// ==================== BOT COMMANDS ====================

// /start command
bot.command('start', (ctx) => {
    const msg = 
        `<b>🚀 HTTP Check Bot</b>\n\n` +
        `<b>Fast Website Checker from ${SERVERS.length} Locations</b>\n\n` +
        `<b>Commands:</b>\n` +
        `<code>/http &lt;url&gt;</code> - Check website status\n` +
        `<code>/ping &lt;url&gt;</code> - Quick ping test\n` +
        `<code>/help</code> - Show help\n\n` +
        `<b>Examples:</b>\n` +
        `<code>/http google.com</code>\n` +
        `<code>/http https://github.com</code>\n\n` +
        `<b>Features:</b>\n` +
        `• Check from ${SERVERS.length} global locations\n` +
        `• Detect all HTTP status codes (200, 301, 302, 404, 500, etc.)\n` +
        `• Network error detection (Timeout, Broken Pipe, DNS Error)\n` +
        `• SSL certificate checking\n` +
        `• Redirect tracking\n` +
        `• Response time analysis`;
    
    ctx.reply(msg, { 
        parse_mode: 'HTML',
        disable_web_page_preview: true 
    });
});

// /help command
bot.command('help', async (ctx) => {
    const helpMsg = 
        `<b>📖 HTTP Check Bot Help</b>\n\n` +
        `<b>Available Commands:</b>\n` +
        `<code>/start</code> - Start the bot\n` +
        `<code>/help</code> - Show this help message\n` +
        `<code>/http &lt;url&gt;</code> - Full website check\n` +
        `<code>/ping &lt;url&gt;</code> - Quick ping test\n\n` +
        `<b>Supported URL Formats:</b>\n` +
        `• google.com\n` +
        `• www.example.com\n` +
        `• https://github.com\n` +
        `• http://example.com\n\n` +
        `<b>Detected Errors:</b>\n` +
        `✅ HTTP 200-299: Success\n` +
        `↪️ HTTP 300-399: Redirect (301, 302, etc.)\n` +
        `⚠️ HTTP 400-499: Client Error (404, 403, etc.)\n` +
        `❌ HTTP 500-599: Server Error\n` +
        `🚨 Network: Timeout, Broken Pipe, DNS Error\n` +
        `🔐 SSL: Certificate errors\n\n` +
        `<b>Response Time Indicators:</b>\n` +
        `🟢 0-500ms: Excellent\n` +
        `🟡 500-2000ms: Good\n` +
        `🔴 2000ms+: Slow`;
    
    ctx.reply(helpMsg, { 
        parse_mode: 'HTML',
        disable_web_page_preview: true 
    });
});

// /ping command
bot.command('ping', async (ctx) => {
    try {
        const args = ctx.message.text.split(' ');
        
        if (args.length < 2) {
            return ctx.reply(
                '<b>❌ Format:</b> <code>/ping &lt;url&gt;</code>\n<b>Example:</b> <code>/ping google.com</code>',
                { parse_mode: 'HTML' }
            );
        }
        
        const inputUrl = args.slice(1).join(' ');
        const url = formatUrl(inputUrl);
        
        const loadingMsg = await ctx.reply(
            `<b>⏳ Quick Ping Test...</b>\n<code>${escapeHtml(url)}</code>`,
            { parse_mode: 'HTML' }
        );
        
        // Check from 4 servers
        const quickServers = [SERVERS[8], SERVERS[0], SERVERS[3], SERVERS[14]]; // SG, US, DE, ID
        const results = [];
        
        for (const server of quickServers) {
            try {
                const result = await checkServer(url, server);
                results.push(result);
            } catch (e) {
                // Skip error
            }
        }
        
        // Format results
        let message = `<b>🏓 Ping Results</b>\n<code>${escapeHtml(url)}</code>\n\n`;
        
        results.forEach(result => {
            const icon = result.code >= 200 && result.code < 300 ? '✅' : '❌';
            const statusMsg = getStatusMsg(result.code, result.isRedirect);
            message += `${icon} ${result.server.emoji} ${result.server.city}: ${result.code} - ${result.time}ms (${statusMsg})\n`;
        });
        
        const successfulTimes = results.filter(r => r.code >= 200 && r.code < 300).map(r => r.time);
        const avgTime = successfulTimes.length > 0 
            ? Math.round(successfulTimes.reduce((sum, r) => sum + r.time, 0) / successfulTimes.length)
            : 0;
        
        message += `\n<b>📊 Average Response:</b> ${avgTime}ms`;
        
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMsg.message_id,
            null,
            message,
            { parse_mode: 'HTML' }
        );
        
    } catch (error) {
        ctx.reply(`❌ Error: ${error.message}`, { parse_mode: 'HTML' });
    }
});

// /http command - main function
bot.command('http', async (ctx) => {
    try {
        const args = ctx.message.text.split(' ');
        
        if (args.length < 2) {
            return ctx.reply(
                '<b>❌ Format:</b> <code>/http &lt;url&gt;</code>\n<b>Example:</b> <code>/http google.com</code>',
                { parse_mode: 'HTML' }
            );
        }
        
        const inputUrl = args.slice(1).join(' ');
        const url = formatUrl(inputUrl);
        
        console.log(`Checking: ${url} for user: ${ctx.from.id}`);
        
        // Send loading message
        const loadingMsg = await ctx.reply(
            `<b>🔍 Scanning Started</b>\n` +
            `<code>${escapeHtml(url)}</code>\n` +
            `<b>⏱️ Estimated: 3-5 seconds</b>\n` +
            `Checking from ${SERVERS.length} locations...`,
            { 
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }
        );
        
        const results = [];
        const promises = [];
        
        // Check all servers
        for (const server of SERVERS) {
            promises.push(
                (async () => {
                    try {
                        const result = await checkServer(url, server);
                        results.push(result);
                    } catch (error) {
                        results.push({
                            success: false,
                            server: server,
                            code: 500,
                            time: 0,
                            status: 'Check Failed'
                        });
                    }
                })()
            );
            
            // Limit concurrent requests
            if (promises.length >= 5) {
                await Promise.all(promises);
                promises.length = 0;
                
                // Update progress
                const progress = Math.round((results.length / SERVERS.length) * 100);
                try {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        loadingMsg.message_id,
                        null,
                        `<b>🔍 Scanning...</b> ${results.length}/${SERVERS.length}\n` +
                        `<code>${escapeHtml(url)}</code>\n` +
                        `<b>⏱️ Progress:</b> ${progress}% complete`,
                        { parse_mode: 'HTML' }
                    );
                } catch (e) {
                    // Ignore edit errors
                }
            }
        }
        
        // Wait for remaining promises
        if (promises.length > 0) {
            await Promise.all(promises);
        }
        
        // Prepare data
        const data = {
            url: url,
            results: results
        };
        
        // Format results
        const resultText = formatResultsHTML(data);
        
        // Save for copy
        const dataId = `${ctx.chat.id}_${Date.now()}`;
        userData.set(dataId, resultText);
        
        // Create buttons
        const buttons = Markup.inlineKeyboard([
            [
                Markup.button.callback('📋 Copy', `copy_${dataId}`),
                Markup.button.callback('🔄 Recheck', `recheck_${Buffer.from(url).toString('base64')}`)
            ],
            [
                Markup.button.callback('🏓 Quick Ping', `quick_${Buffer.from(url).toString('base64')}`),
                Markup.button.url('🌐 Full Report', 
                    `https://check-host.net/check-http?host=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`)
            ]
        ]);
        
        // Update message with results
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMsg.message_id,
            null,
            resultText,
            {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: buttons.reply_markup
            }
        );
        
        console.log(`✅ Check completed: ${url}`);
        
    } catch (error) {
        console.error('HTTP command error:', error);
        
        await ctx.reply(
            `<b>❌ Check Failed!</b>\n\n` +
            `<b>Error:</b> ${escapeHtml(error.message)}\n\n` +
            `<b>Try:</b> <code>/http example.com</code>`,
            { parse_mode: 'HTML' }
        );
    }
});

// ==================== BUTTON HANDLERS ====================

// Copy button
bot.action(/copy_(.+)/, async (ctx) => {
    try {
        const dataId = ctx.match[1];
        const htmlText = userData.get(dataId);
        
        if (!htmlText) {
            return ctx.answerCbQuery('❌ Data expired');
        }
        
        // Convert to plain text
        const plainText = htmlText
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
        
        await ctx.reply(
            `<b>📋 Results Copied</b>\n\n<pre><code>${escapeHtml(plainText.substring(0, 2000))}</code></pre>`,
            { 
                parse_mode: 'HTML',
                disable_web_page_preview: true 
            }
        );
        
        await ctx.answerCbQuery('✅ Copied to chat!');
        
    } catch (error) {
        ctx.answerCbQuery('❌ Copy failed');
    }
});

// Recheck button
bot.action(/recheck_(.+)/, async (ctx) => {
    try {
        const encodedUrl = ctx.match[1];
        const url = Buffer.from(encodedUrl, 'base64').toString('utf8');
        
        await ctx.answerCbQuery('🔍 Rechecking...');
        await ctx.reply(
            `<b>🔄 Rechecking...</b>\n<code>${escapeHtml(url)}</code>`,
            { parse_mode: 'HTML' }
        );
        
        // Simulate command
        ctx.message = { text: `/http ${url}` };
        return bot.command('http')(ctx);
        
    } catch (error) {
        ctx.answerCbQuery('❌ Error');
    }
});

// Quick ping button
bot.action(/quick_(.+)/, async (ctx) => {
    try {
        const encodedUrl = ctx.match[1];
        const url = Buffer.from(encodedUrl, 'base64').toString('utf8');
        
        await ctx.answerCbQuery('🏓 Quick ping...');
        await ctx.reply(
            `<b>🏓 Quick Ping Test</b>\n<code>${escapeHtml(url)}</code>`,
            { parse_mode: 'HTML' }
        );
        
        // Simulate command
        ctx.message = { text: `/ping ${url}` };
        return bot.command('ping')(ctx);
        
    } catch (error) {
        ctx.answerCbQuery('❌ Ping failed');
    }
});

// ==================== VERCEl SERVERLESS CONFIG ====================

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Bot is running',
        service: 'Telegram HTTP Check Bot',
        version: '1.0.0',
        servers: SERVERS.length,
        timestamp: new Date().toISOString(),
        endpoints: ['/webhook', '/status']
    });
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version,
        servers_count: SERVERS.length
    });
});

// Webhook endpoint for Vercel
app.post('/webhook', async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});

// Handle all other routes
app.all('*', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ==================== START BOT ====================

// Start bot in polling mode (for development)
if (process.env.NODE_ENV !== 'production') {
    bot.launch().then(() => {
        console.log(`✅ Bot is running in development mode!`);
        console.log(`📱 Servers: ${SERVERS.length}`);
        console.log(`🌐 Commands: /start /help /http /ping`);
    }).catch(err => {
        console.error('❌ Failed to start:', err);
    });
}

// Export for Vercel serverless
module.exports = app;

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    bot.stop('SIGTERM');
    process.exit(0);
});
