import express from 'express';
import controller from '../controllers/Game.controller';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';
import { requireAuthentication, requireNotToBeBanned } from '../middleware/Authentication';


const router = express.Router();

router.post('', [
  requireAuthentication as express.RequestHandler,
  requireNotToBeBanned,
  ValidateSchema(Schema.game.create)
], controller.createGame);
router.get('/apply/:gameId', [
  requireAuthentication as express.RequestHandler,
  requireNotToBeBanned
], controller.applyGame);
router.get('/master',[requireAuthentication as express.RequestHandler], controller.getGamesForMaster);
router.get('/player',[requireAuthentication as express.RequestHandler], controller.getGamesForPlayer);
router.get('/:gameId', controller.readGame);
router.get('', controller.readAll);
router.put('/:gameId', [
  requireAuthentication as express.RequestHandler,
  ValidateSchema(Schema.game.update)
], controller.updateGame);
router.patch('/:gameId/:username', [requireAuthentication as express.RequestHandler], controller.removePlayerFromGame);
router.delete('/:gameId', controller.deleteGame);

export = router;
