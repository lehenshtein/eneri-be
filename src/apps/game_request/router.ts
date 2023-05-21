import express from 'express';
import controller from './controllers';
import { Schema, ValidateSchema } from '../../middleware/ValidateSchema';
import { requireAuthentication, requireNotToBeBanned } from '../../middleware/Authentication';
import { multipartConvert } from "../../middleware/MultipartConvert";
import { uploadHandler } from "../../library/ImageUpload";

const router = express.Router();

router.post('', [
  requireAuthentication as express.RequestHandler,
  requireNotToBeBanned,
  uploadHandler,
  multipartConvert,
  ValidateSchema(Schema.gameRequest.create)
], controller.createGameRequest);
router.get('/:gameId', controller.readGameRequest);
router.get('', controller.readAll);
router.put('/:gameId', [
  requireAuthentication as express.RequestHandler,
  uploadHandler,
  multipartConvert,
  ValidateSchema(Schema.gameRequest.update)
], controller.updateGameRequest);

export = router;
