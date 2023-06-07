import controller from './user.controllers';
import { requireAuthentication } from '../../middleware/Authentication';
import express from 'express';
import { Schema, ValidateSchema } from '../../middleware/ValidateSchema';
import { multipartConvert } from "../../middleware/MultipartConvert";
import { uploadHandler } from "../../library/ImageUpload";

const userRouter = express.Router();

userRouter.get('/:username', controller.getUserByUsername);
userRouter.get('', [requireAuthentication as express.RequestHandler], controller.getUser);
userRouter.patch('', [
  requireAuthentication as express.RequestHandler,
  uploadHandler,
  multipartConvert,
  ValidateSchema(Schema.userUpdate),
], controller.editUser);

export = userRouter;
