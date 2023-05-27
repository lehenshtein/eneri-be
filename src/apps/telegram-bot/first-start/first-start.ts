import TelegramBot, { Chat,  User } from 'node-telegram-bot-api';
import FirstStartModel, { IChatModel } from './first-start.model';
import mongoose from 'mongoose';

const saveUserChat = async (chat: Chat | User, bot: TelegramBot, senderId: number) => {
  const user: IChatModel | null= await FirstStartModel.findOne({ tgUserId: chat.id }, '_id');
  console.log(user);
  if (!user) {
    console.log('noUser');
    const newUser = new FirstStartModel({
      _id: new mongoose.Types.ObjectId(),
      tgUserId: chat.id,
      username: chat.username,
      firstName: chat.first_name,
      lastName: chat.last_name
    })
    return newUser.save()
      .then(() => {
        bot.sendMessage(senderId, `Вітаю, ${chat.first_name || chat.username || 'Користувач'}`)
      })
      .catch((err: Error) => {
        bot.sendMessage(senderId, `${err}`)
      });
  }

}

export default { saveUserChat };
