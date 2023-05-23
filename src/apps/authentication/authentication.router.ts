import express from 'express';
import controller from './authentication.controllers';
import { Schema, ValidateSchema } from '../../middleware/ValidateSchema';
import { requireAuthentication } from '../../middleware/Authentication';

const authenticationRouter = express.Router();

authenticationRouter.post('/login', ValidateSchema(Schema.authentication.login), controller.login);
authenticationRouter.post('/register', ValidateSchema(Schema.authentication.register), controller.register);
authenticationRouter.get('/verification/resend', [requireAuthentication as express.RequestHandler], controller.resendMail);
authenticationRouter.get('/verification/:code', [requireAuthentication as express.RequestHandler], controller.verify);

export = authenticationRouter;
