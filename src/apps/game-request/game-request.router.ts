import express from 'express';
import controller from './game-request.controller';
import { Schema, ValidateSchema } from '../../middleware/ValidateSchema';
import { requireAuthentication, requireNotToBeBanned } from '../../middleware/Authentication';
import { multipartConvert } from "../../middleware/MultipartConvert";
import { uploadHandler } from "../../library/ImageUpload";

const gameRequestRouter = express.Router();

gameRequestRouter.post('', [
  requireAuthentication as express.RequestHandler,
  requireNotToBeBanned,
  uploadHandler,
  multipartConvert,
  ValidateSchema(Schema.gameRequest.create)
], controller.createGameRequest);
gameRequestRouter.get('/apply/:gameId', [
  requireAuthentication as express.RequestHandler,
  requireNotToBeBanned
], controller.applyGameRequest);
gameRequestRouter.get('/:gameId', controller.readGameRequest);
gameRequestRouter.get('', controller.readAll);
gameRequestRouter.put('/:gameId', [
  requireAuthentication as express.RequestHandler,
  uploadHandler,
  multipartConvert,
  ValidateSchema(Schema.gameRequest.update)
], controller.updateGameRequest);
gameRequestRouter.patch('/:gameId/:username', [requireAuthentication as express.RequestHandler], controller.removePlayerFromGameRequest);

export = gameRequestRouter;
