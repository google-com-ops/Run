module.exports = {
  command: 'help',
  description: 'Menampilkan informasi panduan sistem',

  execute: async (bot, msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const helpMsg = `
*PANDUAN OPERASIONAL SISTEM*
---------------------------------------
*Daftar Instruksi Tersedia:*

1. /start
Menginisialisasi ulang sesi dan menjalankan protokol penyambutan sistem.
---------------------------------------
*LOG_ID:* \`${userId}\`
*STATUS:* \`SYSTEM_READY\`
    `.trim();

    try {
      bot.sendChatAction(chatId, 'typing').catch(() => {});

      await bot.sendMessage(chatId, helpMsg, {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Hubungi Administrator', url: 'https://danxyofficial.zapto.org' }
            ]
          ]
        }
      });

      console.log(`[FAST-LOG] /help executed for ID: ${userId}`);
    } catch (error) {
      console.error(`[ERROR] /help failed: ${error.message}`);
      
      await bot.sendMessage(chatId, "Terjadi kesalahan teknis saat memuat panduan sistem.");
    }
  }
};
