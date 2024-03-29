import dotenv from 'dotenv';
dotenv.config();

const MONGO_USERNAME = process.env.MONGO_USERNAME || '';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';
const NODE_ENV = process.env.NODE_ENV || 'dev';
const CLUSTER_NAME = process.env.CLUSTER_NAME || '';
const MONGO_URL = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster0.${CLUSTER_NAME}.mongodb.net`;
const EMAIL_LOGIN = process.env.EMAIL_LOGIN || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const frontProdUrl = 'https://eneri.com.ua/';
const frontStageUrl = 'https://eneri.com.ua/';
const frontLocalUrl = 'http://localhost:4200/';

const frontUrl = NODE_ENV === 'local' ? frontLocalUrl : NODE_ENV === 'dev' ? frontStageUrl : frontProdUrl;

const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSize = 1024 * 1024 * 3; // 3 MB
const imgResizeWidth = 420; // width of pictures which will be returned to FE

const ImagekitID = process.env.IMAGEKIT_ID || '';
const ImagekitUrl = `https://ik.imagekit.io/${ImagekitID}`;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';

export const config = {
  telegram: {
    token: TELEGRAM_TOKEN
  },
  mongo: {
    url: MONGO_URL
  },
  server: {
    port: PORT
  },
  env: NODE_ENV,
  email: {
    login: EMAIL_LOGIN,
    password: EMAIL_PASSWORD
  },
  frontUrl: frontUrl,
  supportedImageTypes: supportedImageTypes,
  maxImageSize: maxImageSize,
  ImagekitID: ImagekitID,
  ImagekitUrl: ImagekitUrl,
  imgResizeWidth: imgResizeWidth,
};
