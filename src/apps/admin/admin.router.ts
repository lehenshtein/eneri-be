import { requireAuthentication } from '../../middleware/Authentication';
import express from 'express';
import controller from './admin.controller';
const adminRouter = express.Router();
adminRouter.get('/changeEmailVerification/:username', [requireAuthentication as express.RequestHandler], controller.changeEmailVerification);
adminRouter.get('/changeGameRole/:username', [requireAuthentication as express.RequestHandler], controller.changeGameRole);
adminRouter.get('/user/:usernameOrEmail', [requireAuthentication as express.RequestHandler], controller.getUserForAdmin);
adminRouter.get('/stats', [requireAuthentication as express.RequestHandler], controller.getStats);

export = adminRouter;
