import express from 'express';
import controller from '../controllers/Game.controller';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';
import { requireAuthentication } from '../middleware/Authentication';


const router = express.Router();

router.post('', [
  requireAuthentication as express.RequestHandler,
  ValidateSchema(Schema.game.create)
], controller.createGame);
router.get('/apply/:gameId', [
  requireAuthentication as express.RequestHandler
], controller.applyGame);
router.get('/:gameId', controller.readGame);
router.get('', controller.readAll);
router.get('/user/:name', controller.getGamesForMaster);
router.put('/:gameId', [
  requireAuthentication as express.RequestHandler,
  ValidateSchema(Schema.game.update)
], controller.updateGame);
router.delete('/:gameId', controller.deleteGame);

export = router;
