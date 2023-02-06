"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuthentication = exports.addUserToRequest = void 0;
const logger_1 = __importDefault(require("../library/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const addUserToRequest = async (req, res, next) => {
    try {
        const token = req.get('authorization');
        if (token) {
            try {
                const tokenPayload = jsonwebtoken_1.default.verify(token, process.env.JWT_SIGN_KEY || '123');
                req.tokenPayload = tokenPayload;
                req.user = await User_model_1.default.findOne({ email: tokenPayload.email });
            }
            catch (err) {
                logger_1.default.log(`Received invalid token ${token}`);
            }
        }
        next();
    }
    catch (err) {
        logger_1.default.err(err);
        return res.status(422).json({ err });
    }
};
exports.addUserToRequest = addUserToRequest;
const requireAuthentication = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Invalid or missing authentication token' });
    }
    next();
};
exports.requireAuthentication = requireAuthentication;
