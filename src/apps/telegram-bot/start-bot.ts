import TelegramBot, { Message } from 'node-telegram-bot-api';
import { config } from '../../config/config';
import firstStart from './first-start/first-start';
const bot = new TelegramBot(config.telegram.token, {polling: true});

export function StartBot() {
  bot.onText(/\/start/, (msg: Message, match: RegExpExecArray | null) => {
    firstStart.saveUserChat(msg.chat, bot, msg.chat.id);
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
    bot.sendMessage(chatId, "Change this method")
  })
}

// export default { StartBot }
