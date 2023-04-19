import controller from '../controllers/User.controller';
import { requireAuthentication } from '../middleware/Authentication';
import express from 'express';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';

const router = express.Router();

router.get('/:username', controller.getUserByUsername);
router.get('', [requireAuthentication as express.RequestHandler], controller.getUser);
router.patch('', [requireAuthentication as express.RequestHandler, ValidateSchema(Schema.userUpdate),], controller.editUser);

export = router;
