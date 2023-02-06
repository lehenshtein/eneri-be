"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("./config/config");
const logger_1 = __importDefault(require("./library/logger"));
const http_1 = __importDefault(require("http"));
const Authentication_1 = require("./middleware/Authentication");
const routes_1 = require("./routes/routes");
const router = (0, express_1.default)();
// Connect to mongo
mongoose_1.default.connect(config_1.config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(() => {
    logger_1.default.log('connected to db');
    StartServer();
})
    .catch((err) => {
    logger_1.default.err('Unable to connect');
    logger_1.default.err(err);
});
// Start server only if/after mongo connect
function StartServer() {
    router.use((req, res, next) => {
        // Log the request
        logger_1.default.info(`Incoming -> method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}]`);
        res.on('finish', () => {
            // Log the response
            logger_1.default.info(`Incoming -> method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket
                .remoteAddress}] - Status: [${res.statusCode}]`);
        });
        next();
    });
    router.use(express_1.default.urlencoded({ extended: true }));
    router.use(express_1.default.json());
    // Rules of API
    router.use((req, res, next) => {
        let allowedOrigins = ['http://localhost:4200', 'http://localhost:8080'];
        if (config_1.config.env === 'prod') {
            allowedOrigins = [];
        }
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        else {
            config_1.config.env === 'prod'
                ? res.header('Access-Control-Allow-Origin', 'https://memologist-prod.herokuapp.com')
                : res.header('Access-Control-Allow-Origin', 'https://memologist.herokuapp.com');
        }
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Expose-Headers', 'X-Page, X-Limit');
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
            return res.status(200).json({});
        }
        next();
    });
    // auth middleware
    router.use(Authentication_1.addUserToRequest);
    // Routes
    router.use('/auth', routes_1.AuthRoutes);
    router.use('/user', routes_1.UserRoutes);
    // HealthCheck
    router.get('/ping', (req, res, next) => res.status(200).json({ message: 'eneri online' }));
    // Error handling
    router.use((req, res, next) => {
        const error = new Error('not found');
        logger_1.default.err(error);
        return res.status(404).json({ message: error.message });
    });
    http_1.default.createServer(router).listen(config_1.config.server.port, () => logger_1.default.info(`Server is running on port:
    http://localhost:${config_1.config.server.port}`));
}
