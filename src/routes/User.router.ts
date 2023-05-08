import controller from '../controllers/User.controller';
import { requireAuthentication } from '../middleware/Authentication';
import express from 'express';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';
import { multipartConvert } from "../middleware/MultipartConvert";
import { uploadHandler } from "../library/ImageUpload";

const router = express.Router();

router.get('/:username', controller.getUserByUsername);
router.get('', [requireAuthentication as express.RequestHandler], controller.getUser);
router.patch('', [
  requireAuthentication as express.RequestHandler,
  uploadHandler,
  multipartConvert,
  ValidateSchema(Schema.userUpdate),
], controller.editUser);

export = router;
