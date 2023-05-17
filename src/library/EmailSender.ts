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
    subject: 'ЕНЕРІ | Верифікація пошти. ENERI | Email verification.',
    text:
          `<p><b><a href="https://eneri.com.ua">ЕНЕРІ</a> - настільні рольові ігри в Україні.</b></p>
          <p>Будь-ласка, підтвердь свою пошту, натиснувши на посилання знизу.</p>
          <p>Або вставте цей код у поле верифікації: ${verificationKey}.</p>
          <p>Please, confirm your email, by clicking on the link below.</p>
          <p>Or paste this code to verification input: ${verificationKey}.</p>
          <p><a href='${config.frontUrl}verification/${verificationKey}'>
            ${config.frontUrl}verification/${verificationKey}
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
