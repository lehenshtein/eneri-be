import TelegramBot, { Message } from 'node-telegram-bot-api';
import { config } from '../../config/config';
import firstStart from './first-start/first-start';
import { emojis } from '../../helpers/emoji';

export function StartBot() {
  const bot = new TelegramBot(config.telegram.token, {polling: true});
  bot.onText(/\/start/, (msg: Message, match: RegExpExecArray | null) => {
    firstStart.saveUserChat(msg.chat, bot, msg.chat.id);
    bot.sendMessage(msg.chat.id, 'Це старт', {
      reply_markup: {
        keyboard: [[{text: `/start ${emojis.smiley}`}, {text: `otherbtn ${emojis.expressionless}`}],[{text: `third ${emojis.smirking}`}]],
        input_field_placeholder: 'Оберіть щось з меню'
      }
    });
  })

  bot.on('message', (msg: Message) => {
    const chatId = msg.chat.id;
    const forward = msg.forward_from;
    if (forward) {
      firstStart.saveUserChat(forward, bot, msg.chat.id);
      bot.sendMessage(chatId, `
        name: ${forward.first_name || ''} ${forward.last_name || ''}
        username: ${forward.username || ''}
        userId: ${forward.id}
      `)
    }
    // console.log(msg);
    bot.sendMessage(chatId, `You send ${msg.text}`)
  })
}

// export default { StartBot }
