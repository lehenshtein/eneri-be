import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/config';
import Logger from './library/logger';
import http from 'http';
import { addUserToRequest } from './middleware/Authentication';
import { AuthRoutes, GameRoutes, UserRoutes, GameRequestRoutes, AdminRoutes } from './routes';
import { startCronJobs } from "./cron/CronIndex";
import { StartBot } from './apps/telegram-bot/start-bot';

const router = express();
// Connect to mongo
mongoose.connect(config.mongo.url, { retryWrites: true, w: 'majority' })
  .then(() => {
    Logger.log('connected to db');
    StartServer();
    if (config.env !== 'local') {
      StartBot();
    }
  })
  .catch((err) => {
    Logger.err('Unable to connect');
    Logger.err(err);
  });

// Start server only if/after mongo connect
function StartServer () {

  router.use((req, res, next) => {
    // Log the request
    Logger.info(`Incoming -> method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

    res.on('finish', () => {
      // Log the response
      Logger.info(`Incoming -> method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket
        .remoteAddress}] - Status: [${res.statusCode}]`);
    });

    next();
  });

  if (config.env !== 'local') { // disabling cron for local env
    startCronJobs();
  }

  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());

  // Rules of API
  router.use((req, res, next) => {
    let allowedOrigins = ['http://localhost:4200', 'http://localhost:5000','http://localhost:8080'];
    if (config.env === 'prod') {
      allowedOrigins = ['https://eneri.com.ua', 'https://eneri-ebb46.web.app'];
    }
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin!)) {
      res.setHeader('Access-Control-Allow-Origin', origin!);
    }
    res.setHeader('x-req-from', 'imagekit');

    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Expose-Headers', 'X-Page, X-Limit, X-Total');
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
      return res.status(200).json({});
    }

    next();
  });

  // auth middleware
  router.use(addUserToRequest as express.RequestHandler);

  // Routes
  router.use('/auth', AuthRoutes);
  router.use('/user', UserRoutes);
  router.use('/game', GameRoutes);
  router.use('/game-request', GameRequestRoutes);
  router.use('/admin', AdminRoutes);

  // HealthCheck
  router.get('/ping', (req, res, next) => res.status(200).json({ message: 'eneri online' }));

  // Error handling
  router.use((req, res, next) => {
    const error = new Error('not found');
    Logger.err(error);

    return res.status(404).json({ message: error.message });
  });

  http.createServer(router).listen(config.server.port, () => Logger.info(`Server is running on port:
    http://localhost:${config.server.port}`));
}
