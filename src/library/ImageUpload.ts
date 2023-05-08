import { Express } from 'express';
import ImageKit from 'imagekit';
import Crypto from "crypto";
import { fromBuffer } from 'file-type';
import { UploadOptions } from 'imagekit/dist/libs/interfaces';
import { config } from '../config/config';
import multer from 'multer';

type fileType = Express.Multer.File[] | undefined;

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxImageSize
  }
});
const uploadHandler = upload.array('images', 10);

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: config.ImagekitUrl
});


const validateFiles = async (files: fileType) => {
  if (files) {
    for (const file of files!) {
      const fileType = await fromBuffer(file.buffer);
      if (!fileType || !config.supportedImageTypes.includes(fileType.mime)) {
        return { result: false, message: 'Unsupported file type', imgUrl: null };
      }
    }
  }
  return { result: true, message: '' };
};

function isImageUploaded (imgUrl: string) {
  return imgUrl.includes(config.ImagekitUrl);
}

const uploadFile = async (files: fileType, imgUrl?: string) => {
  const fileValidation = await validateFiles(files);
  if (!fileValidation.result) {
    return fileValidation;
  }

  const postData: Record<string, any> = {
    fileName: Crypto.randomBytes(12).toString('hex'),
    useUniqueFileName: false,
    folder: '/user_uploads/'
  };

  if (imgUrl) {
    postData.file = imgUrl;
  } else if (files) {
    const file = files[0];
    postData.file = file.buffer;
  } else {
    return { result: false, message: 'Invalid request, no image passed', imgUrl: null };
  }

  try {
    const response = await imagekit.upload(postData as UploadOptions);
    return { result: true, message: '', imgUrl: response.url };
  } catch (err) {
    let msg = '';
    if (err instanceof Error) {
      msg = err.message;
    } else {
      console.error(err);
      msg = 'Unknown error';
    }
    return { result: false, message: `Error while uploading image: ${msg}`, imgUrl: null };
  }
};

export { fileType, uploadFile, uploadHandler, isImageUploaded };
