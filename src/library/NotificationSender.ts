import { IUser, IUserModel } from '../apps/user/user.models';
import { sendEmail } from './EmailSender';
import Logger from './logger';
import { IGameModel } from '../apps/game/game.models';

export function getNewApplyMessage(game: IGameModel, newUsername: string): string {
  return `<p><b><a href="https://eneri.com.ua">ЕНЕРІ</a> - настільні рольові ігри в Україні.</b></p>
          <p>У вас новий запис на гру - ${game.title}</p>
          <p>Користувач з ніком - ${newUsername}.</p>
          <br>
          <p>Перейти до гри:</p>
          <p><a href='https://eneri.com.ua/${game.master.username}/${game._id}'>
              https://eneri.com.ua/${game.master.username}/${game._id}
            </a></p>
          <p></p>
          <a href="https://eneri.com.ua">eneri.com.ua</a>`
}

export async function sendNotification(user: IUser, subject: string, text: string) {
  try {
    await sendEmail(user.email, subject, text);
  } catch (err) {
    Logger.err(err);
  }
}
