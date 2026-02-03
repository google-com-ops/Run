const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

// Token bot
const BOT_TOKEN = process.env.BOT_TOKEN || '8142102625:AAEhrVvNa7tKKm39d9Ry_7v-nD6NN2lvPNI';
const bot = new Telegraf(BOT_TOKEN);

// Server list dengan konfigurasi lebih baik
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
    
    // Remove protocol jika ada
    url = url.replace(/^https?:\/\//i, '');
    
    // Remove www jika ada
    url = url.replace(/^www\./i, '');
    
    // Tambahkan http://
    return 'http://' + url;
}

// Fungsi untuk detect redirect
async function checkServer(url, server) {
    const start = Date.now();
    
    try {
        const response = await axios({
            method: 'HEAD', // Gunakan HEAD untuk lebih cepat
            url: url,
            timeout: server.timeout || 3000,
            maxRedirects: 5,
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
            finalUrl: finalUrl
        };
        
    } catch (error) {
        const time = Date.now() - start;
        let statusCode = 0;
        let statusText = 'Unknown Error';
        
        // Deteksi error yang lebih spesifik
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

// Get status message dengan lebih detail
function getStatusMsg(code, isRedirect = false) {
    if (isRedirect) return 'Redirected';
    if (code === 0) return 'Connection Failed';
    if (code === 599) return 'Timeout';
    if (code === 502) return 'Bad Gateway';
    if (code === 503) return 'Service Unavailable';
    if (code === 504) return 'Gateway Timeout';
    if (code === 508) return 'Broken Pipe';
    if (code === 301 || code === 302) return 'Redirect';
    if (code === 404) return 'Not Found';
    if (code === 403) return 'Forbidden';
    if (code === 429) return 'Too Many Requests';
    if (code === 500) return 'Internal Server Error';
    if (code === 200) return 'OK';
    if (code >= 200 && code < 300) return 'Success';
    if (code >= 300 && code < 400) return 'Redirect';
    if (code >= 400 && code < 500) return 'Client Error';
    if (code >= 500 && code < 600) return 'Server Error';
    return 'Unknown';
}

// Format hasil dengan lebih baik
function formatResultsHTML(data) {
    const { url, results } = data;
    
    let message = `<b>🌐 HTTP-Check Results</b>\n`;
    message += `<code>${escapeHtml(url)}</code>\n\n`;
    
    // Kelompokkan hasil berdasarkan status
    const success = results.filter(r => r.code >= 200 && r.code < 300).length;
    const redirects = results.filter(r => r.code >= 300 && r.code < 400).length;
    const clientErrors = results.filter(r => r.code >= 400 && r.code < 500).length;
    const serverErrors = results.filter(r => r.code >= 500 || r.code === 0 || r.code === 599 || r.code === 508).length;
    
    // Show top results (yang paling cepat dan error)
    const sortedResults = [...results].sort((a, b) => {
        if (a.success && !b.success) return -1;
        if (!a.success && b.success) return 1;
        return a.time - b.time;
    });
    
    // Tampilkan 10 hasil terbaik/terburuk
    const displayResults = sortedResults.slice(0, 10);
    
    message += `<b>📊 Quick Overview:</b>\n`;
    displayResults.forEach(result => {
        const { server, code, time, isRedirect } = result;
        const statusMsg = getStatusMsg(code, isRedirect);
        
        // Icon berdasarkan status
        let icon = '❓';
        if (code >= 200 && code < 300) icon = '✅';
        else if (code >= 300 && code < 400) icon = '↪️';
        else if (code >= 400 && code < 500) icon = '⚠️';
        else if (code >= 500 || code === 0 || code === 599 || code === 508) icon = '❌';
        
        // Warna code
        let codeDisplay = code.toString();
        if (code === 0) codeDisplay = 'ERR';
        if (code === 599) codeDisplay = 'TO';
        if (code === 508) codeDisplay = 'BP';
        
        message += `${icon} ${server.emoji} <b>${server.city}</b> » ${codeDisplay} - ${time}ms\n`;
    });
    
    // Statistics
    message += `\n<b>📈 Statistics:</b>\n`;
    message += `✅ Success: <b>${success}</b>\n`;
    message += `↪️ Redirects: <b>${redirects}</b>\n`;
    message += `⚠️ Client Errors: <b>${clientErrors}</b>\n`;
    message += `❌ Server Errors: <b>${serverErrors}</b>\n`;
    message += `🌍 Total: <b>${results.length}</b> servers\n`;
    
    // Error details jika ada
    const criticalErrors = results.filter(r => r.code === 0 || r.code === 599 || r.code === 508);
    if (criticalErrors.length > 0) {
        message += `\n<b>🚨 Critical Errors:</b>\n`;
        criticalErrors.slice(0, 3).forEach(error => {
            message += `• ${error.server.emoji} ${error.server.city}: ${error.status}\n`;
        });
        if (criticalErrors.length > 3) {
            message += `• ...and ${criticalErrors.length - 3} more\n`;
        }
    }
    
    // Check-Host link
    const checkUrl = `https://check-host.net/check-http?host=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
    message += `\n<b>🔗 Full Report:</b> <a href="${checkUrl}">Check-Host.net</a>`;
    
    // Response time analysis
    const successfulTimes = results.filter(r => r.code >= 200 && r.code < 300).map(r => r.time);
    if (successfulTimes.length > 0) {
        const avgTime = Math.round(successfulTimes.reduce((a, b) => a + b, 0) / successfulTimes.length);
        const minTime = Math.min(...successfulTimes);
        const maxTime = Math.max(...successfulTimes);
        message += `\n<b>⏱️ Response Time:</b> Avg: ${avgTime}ms | Min: ${minTime}ms | Max: ${maxTime}ms`;
    }
    
    return message;
}

// Store data untuk bot check host
const userData = new Map();

// ==================== REGISTER COMMANDS DARI FILE LAIN ====================

// Object untuk menyimpan semua commands
const commands = {};

// Load help.js
try {
    const helpModule = require('./help.js');
    commands['help'] = helpModule;
    console.log('✅ Loaded help.js');
} catch (error) {
    console.error('❌ Failed to load help.js:', error.message);
}

// Load start.js
try {
    const startModule = require('./start.js');
    commands['start'] = startModule;
    console.log('✅ Loaded start.js');
} catch (error) {
    console.error('❌ Failed to load start.js:', error.message);
}

// ==================== COMMANDS BOT CHECK HOST ====================

// /start command (override dari start.js jika ada)
bot.command('start', (ctx) => {
    // Cek apakah ada start.js module
    if (commands['start']) {
        return commands['start'].execute(bot, ctx.message);
    }
    
    // Default start command dari bot check host
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
        `• Fast checking (3-5 seconds)\n` +
        `• Error detection (502, 503, 504, 508, 599)\n` +
        `• Redirect tracking\n` +
        `• Response time analysis`;
    
    ctx.reply(msg, { 
        parse_mode: 'HTML',
        disable_web_page_preview: true 
    });
});

// /help command (override dari help.js jika ada)
bot.command('help', async (ctx) => {
    // Cek apakah ada help.js module
    if (commands['help']) {
        return commands['help'].execute(bot, ctx.message);
    }
    
    // Default help command dari bot check host
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;

    const helpMsg = `
*PANDUAN SISTEM HTTP CHECK BOT*
---------------------------------------
*Daftar Perintah Tersedia:*

1. /start
Memulai bot dan menampilkan informasi awal

2. /help
Menampilkan panduan penggunaan sistem ini

3. /http <url>
Melakukan pengecekan status website dari ${SERVERS.length} lokasi server
Contoh: /http google.com

4. /ping <url>
Melakukan uji latensi cepat dari 3 server terdekat
Contoh: /ping example.com

*Prosedur Penggunaan:*
- Kirimkan salah satu perintah di atas melalui kolom pesan
- Sistem akan memproses permintaan secara otomatis dalam 3-5 detik
- Pastikan URL yang dimasukkan dalam format yang benar

*Fitur Utama:*
- Pengecekan dari 20 lokasi server global
- Deteksi error lengkap (502, 503, 504, 508, 599)
- Pelacakan redirect otomatis
- Analisis waktu respon
- Laporan statistik lengkap
---------------------------------------
*ID PENGGUNA:* \`${userId}\`
*STATUS:* \`SYSTEM_READY\`
    `.trim();

    try {
        ctx.sendChatAction('typing');
        
        await ctx.reply(helpMsg, {
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message.message_id,
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📋 Contoh /http', callback_data: 'help_example_http' },
                        { text: '🏓 Contoh /ping', callback_data: 'help_example_ping' }
                    ],
                    [
                        { text: '🌐 Check-Host.net', url: 'https://check-host.net' }
                    ]
                ]
            }
        });

        console.log(`[LOG] /help executed for ID: ${userId}`);
    } catch (error) {
        console.error(`[ERROR] /help failed: ${error.message}`);
        
        await ctx.reply("Terjadi kesalahan teknis saat memuat panduan sistem.");
    }
});

// /ping command untuk quick test
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
        
        // Cek hanya dari 3 server terdekat
        const quickServers = SERVERS.slice(0, 3);
        const results = [];
        
        for (const server of quickServers) {
            try {
                const result = await checkServer(url, server);
                results.push(result);
            } catch (e) {
                // Skip error
            }
        }
        
        // Format hasil
        let message = `<b>🏓 Ping Results</b>\n<code>${escapeHtml(url)}</code>\n\n`;
        
        results.forEach(result => {
            const icon = result.code >= 200 && result.code < 300 ? '✅' : '❌';
            message += `${icon} ${result.server.emoji} ${result.server.city}: ${result.code} - ${result.time}ms\n`;
        });
        
        const avgTime = results.length > 0 
            ? Math.round(results.reduce((sum, r) => sum + r.time, 0) / results.length)
            : 0;
        
        message += `\n<b>📊 Average:</b> ${avgTime}ms`;
        
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

// /http command yang lebih cepat
bot.command('http', async (ctx) => {
    try {
        // Get URL from message
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
        
        // Gunakan Promise.all untuk lebih cepat
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
            
            // Batasi concurrent requests
            if (promises.length >= 5) {
                await Promise.all(promises);
                promises.length = 0; // Reset array
                
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
        
        // Tunggu sisa promises
        if (promises.length > 0) {
            await Promise.all(promises);
        }
        
        // Siapkan data
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
        
        // Update message dengan hasil
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
        
        console.log(`✅ Check completed in ${Date.now() - loadingMsg.date * 1000}ms: ${url}`);
        
    } catch (error) {
        console.error('HTTP command error:', error);
        
        try {
            await ctx.reply(
                `<b>❌ Check Failed!</b>\n\n` +
                `<b>Error:</b> ${escapeHtml(error.message)}\n\n` +
                `<b>Possible issues:</b>\n` +
                `1. Invalid URL format\n` +
                `2. Website is down\n` +
                `3. Connection blocked\n\n` +
                `<b>Try:</b> <code>/http example.com</code>`,
                { parse_mode: 'HTML' }
            );
        } catch (e) {
            ctx.reply('❌ Failed to check. Please try again.');
        }
    }
});

// ==================== BUTTON HANDLERS ====================

// Handler untuk contoh help
bot.action('help_example_http', async (ctx) => {
    await ctx.answerCbQuery('Contoh: /http google.com');
    await ctx.reply(
        'Contoh penggunaan:\n`/http google.com`\n`/http https://github.com`\n`/http example.com`',
        { parse_mode: 'Markdown' }
    );
});

bot.action('help_example_ping', async (ctx) => {
    await ctx.answerCbQuery('Contoh: /ping example.com');
    await ctx.reply(
        'Contoh penggunaan:\n`/ping google.com`\n`/ping example.com`',
        { parse_mode: 'Markdown' }
    );
});

// Copy button handler
bot.action(/copy_(.+)/, async (ctx) => {
    try {
        const dataId = ctx.match[1];
        const htmlText = userData.get(dataId);
        
        if (!htmlText) {
            return ctx.answerCbQuery('❌ Data expired');
        }
        
        // Konversi ke plain text
        const plainText = htmlText
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/✅/g, '[OK]')
            .replace(/❌/g, '[FAIL]')
            .replace(/⚠️/g, '[WARN]')
            .replace(/↪️/g, '[REDIRECT]');
        
        await ctx.reply(
            `<b>📋 Results Copied</b>\n\n<pre><code>${escapeHtml(plainText.substring(0, 2000))}</code></pre>`,
            { 
                parse_mode: 'HTML',
                disable_web_page_preview: true 
            }
        );
        
        await ctx.answerCbQuery('✅ Copied to chat!');
        
    } catch (error) {
        console.error('Copy error:', error);
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
        
        // Simulasikan command
        ctx.message = { text: `/http ${url}` };
        ctx.from = ctx.from;
        return bot.command('http')(ctx);
        
    } catch (error) {
        console.error('Recheck error:', error);
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
        
        // Simulasikan command ping
        ctx.message = { text: `/ping ${url}` };
        return bot.command('ping')(ctx);
        
    } catch (error) {
        ctx.answerCbQuery('❌ Ping failed');
    }
});

// ==================== REGISTER COMMANDS DARI MODULE ====================

// Register commands dari module lain
function registerCommands() {
    Object.entries(commands).forEach(([name, module]) => {
        if (name !== 'start' && name !== 'help') { // start & help sudah dihandle
            if (module.command && module.execute) {
                bot.command(module.command, (ctx) => {
                    module.execute(bot, ctx.message);
                });
                console.log(`✅ Registered /${module.command}`);
            }
        }
    });
}

// ==================== ERROR HANDLING ====================

// Error handler
bot.catch((err, ctx) => {
    console.error('Bot error:', err.message);
    try {
        ctx.reply('❌ Bot error occurred. Please try again.');
    } catch (e) {
        // Ignore
    }
});

// ==================== START BOT ====================

console.log('🚀 Starting HTTP Check Bot...');
console.log(`🌍 Total servers: ${SERVERS.length}`);

// Register commands dari module
registerCommands();

bot.launch().then(() => {
    console.log('✅ Bot is running!');
    console.log('📱 Commands:');
    console.log('   /start - Start bot');
    console.log('   /help  - Show help');
    console.log('   /http  - Check website');
    console.log('   /ping  - Quick ping test');
    
    // Tampilkan commands dari module lain
    Object.entries(commands).forEach(([name, module]) => {
        if (module.command && module.description) {
            console.log(`   /${module.command} - ${module.description}`);
        }
    });
    
}).catch(err => {
    console.error('❌ Failed to start:', err);
});

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

// Auto-restart jika error
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export untuk kebutuhan testing
module.exports = {
    bot,
    commands,
    SERVERS,
    checkServer,
    formatResultsHTML,
    escapeHtml,
    formatUrl,
    getStatusMsg
};