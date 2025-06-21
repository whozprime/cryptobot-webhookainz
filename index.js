require('dotenv').config();
const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const CRYPTBOT_APP_ID = process.env.CRYPTBOT_APP_ID;
const CRYPTBOT_TOKEN = process.env.CRYPTBOT_TOKEN;
const VIP_CHANNEL_ID = process.env.VIP_CHANNEL_ID;
const PRIDE_CHANNEL_ID = process.env.PRIDE_CHANNEL_ID;

const bot = new TelegramBot(TOKEN);

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔥 Plano VIP', callback_data: 'vip' }],
        [{ text: '⚡ Plano Pride', callback_data: 'pride' }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Bem-vindo! Escolha seu plano abaixo:', options);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const plano = query.data;

  let amount, desc;
  if (plano === 'vip') {
    amount = 10;
    desc = 'Plano VIP';
  } else {
    amount = 15;
    desc = 'Plano Pride';
  }

  try {
    const response = await axios.post(
      'https://pay.crypt.bot/api/createInvoice',
      {
        asset: 'USDT',
        amount,
        description: desc,
        hidden_message: 'Após o pagamento você será adicionado ao canal.',
        paid_btn_name: 'url',
        paid_btn_url: 'https://t.me/Whoainz_bot'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CRYPTBOT_TOKEN}`
        }
      }
    );

    const invoiceUrl = response.data.result.pay_url;
    await bot.sendMessage(chatId, `💸 Aqui está sua fatura para o *${desc}*: [Pagar agora](${invoiceUrl})`, {
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Erro ao criar invoice:', error.response?.data || error);
    bot.sendMessage(chatId, '❌ Ocorreu um erro ao gerar sua fatura. Tente novamente.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
