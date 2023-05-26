import nodemailer, { SentMessageInfo } from 'nodemailer';
import { config } from '../config/config';
import Logger from '../library/logger';

export default class EmailSender {
  receiver: string = '';
  email = {
    subject: '',
    text: ''
  };

  constructor (receiver: string, email: { subject: string, text: string }) {
    this.receiver = receiver;
    this.email = email;
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.ukr.net',
    port: 465,
    secure: true,
    requireTLS: true,
    auth: {
      user: config.email.login,
      pass: config.email.password
    },
    debug: true,
    logger: true
  });

  mailOptions () {
    return {
      from: config.email.login,
      to: this.receiver,
      subject: this.email.subject,
      html: this.email.text
    };
  };

  async sendMail () {
    await this.transporter.sendMail(this.mailOptions(), function (error: Error | null, info: SentMessageInfo) {
      if (error) {
        Logger.err(error);
      } else {
        Logger.log('Email sent: ' + info.response);
      }
    });
  }
}


export async function sendVerificationEmail (receiver: string, verificationKey: string) {
  const emailData = {
    subject: 'ЕНЕРІ | Верифікація пошти.',
    text:
          `<p><b><a href="https://eneri.com.ua">ЕНЕРІ</a> - настільні рольові ігри в Україні.</b></p>
          <p>Будь-ласка, підтвердь свою пошту, натиснувши на посилання знизу.</p>
          <p>Або скопіюйте посилання у браузер.</p>
          <br>
          <p>Ви маєте бути авторизовані на ЕНЕРІ на пристрої з якого підтверджуєте пошту!</p>
          <p><a href='${config.frontUrl}verification/${verificationKey}'>
            ${config.frontUrl}verification/${verificationKey}
          </a></p>
          <br>
          <p>Або вставте цей код: <i>${verificationKey}</i> у поле верифікації за адресою нижче.</p>
          <p><a href='${config.frontUrl}verification'>
              ${config.frontUrl}verification
            </a></p>
          <p></p>
          <a href="https://eneri.com.ua">eneri.com.ua</a>`
  };
  const sender = new EmailSender(receiver, emailData);
  try {
    await sender.sendMail();
  } catch (err) {
    Logger.err(err);
  }
}
