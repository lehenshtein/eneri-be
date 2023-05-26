import express from 'express';
import controller from './game.controllers';
import { Schema, ValidateSchema } from '../../middleware/ValidateSchema';
import { requireAuthentication, requireNotToBeBanned } from '../../middleware/Authentication';
import { multipartConvert } from "../../middleware/MultipartConvert";
import { uploadHandler } from "../../library/ImageUpload";

const gameRouter = express.Router();

gameRouter.post('', [
  requireAuthentication as express.RequestHandler,
  requireNotToBeBanned,
  uploadHandler,
  multipartConvert,
  ValidateSchema(Schema.game.create)
], controller.createGame);
gameRouter.get('/apply/:gameId', [
  requireAuthentication as express.RequestHandler,
  requireNotToBeBanned
], controller.applyGame);
gameRouter.get('/master',[requireAuthentication as express.RequestHandler], controller.getGamesForMaster);
gameRouter.get('/player',[requireAuthentication as express.RequestHandler], controller.getGamesForPlayer);
gameRouter.get('/:gameId', controller.readGame);
gameRouter.get('', controller.readAll);
gameRouter.put('/:gameId', [
  requireAuthentication as express.RequestHandler,
  uploadHandler,
  multipartConvert,
  ValidateSchema(Schema.game.update)
], controller.updateGame);
gameRouter.patch('/:gameId/:username', [requireAuthentication as express.RequestHandler], controller.removePlayerFromGame);
gameRouter.delete('/:gameId', controller.deleteGame);

export = gameRouter;
