"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_USERNAME = process.env.MONGO_USERNAME || '';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';
const NODE_ENV = process.env.NODE_ENV || 'dev';
const CLUSTER_NAME = process.env.CLUSTER_NAME || '';
const MONGO_URL = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster0.${CLUSTER_NAME}.mongodb.net`;
const EMAIL_LOGIN = process.env.EMAIL_LOGIN || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
exports.config = {
    mongo: {
        url: MONGO_URL
    },
    server: {
        port: PORT
    },
    env: NODE_ENV,
    email: {
        login: EMAIL_LOGIN,
        password: EMAIL_PASSWORD
    }
};
