"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = exports.ValidateSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const logger_1 = __importDefault(require("../library/logger"));
const ValidateSchema = (schema) => {
    return async (req, res, next) => {
        try {
            console.log(req.body);
            // console.log(req.files);
            await schema.validateAsync(req.body);
            next();
        }
        catch (err) {
            logger_1.default.err(err);
            return res.status(422).json({ err });
        }
    };
};
exports.ValidateSchema = ValidateSchema;
const idRegex = /^[0-9a-fA=F]{24}$/;
const imgRegex = /^(ftp|http|https):\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)/i;
exports.Schema = {
    post: {
        create: joi_1.default.object({
            title: joi_1.default.string().required().min(5).max(50),
            text: joi_1.default.string().empty('').min(10).max(2000),
            tags: joi_1.default.array().items(joi_1.default.string()),
            imgUrl: joi_1.default.string().empty(null).regex(imgRegex).max(240),
            content: joi_1.default.array().items(joi_1.default.object({
                type: joi_1.default.string().valid('text', 'imgUrl', 'imgName').required(),
                imgUrl: joi_1.default.string().min(5).max(200),
                imgName: joi_1.default.string().min(5).max(200),
                text: joi_1.default.string().min(10).max(2000)
            }))
        }),
        update: joi_1.default.object({
            title: joi_1.default.string().required().min(5).max(50),
            text: joi_1.default.string().empty('').min(10).max(2000),
            tags: joi_1.default.array().items(joi_1.default.string()),
            imgUrl: joi_1.default.string().empty(null).regex(imgRegex).max(240),
            content: joi_1.default.array().items(joi_1.default.object({
                type: joi_1.default.string().valid('text', 'imgUrl', 'imgName').required(),
                imgUrl: joi_1.default.string().min(5).max(200),
                imgName: joi_1.default.string().min(5).max(200),
                text: joi_1.default.string().min(10).max(2000)
            }))
        })
    },
    authentication: {
        register: joi_1.default.object({
            username: joi_1.default.string().required().min(4).max(30),
            email: joi_1.default.string().required().email({ tlds: { allow: false } }),
            password: joi_1.default.string().required().min(8).max(40)
        }),
        login: joi_1.default.object({
            email: joi_1.default.string().required().email({ tlds: { allow: false } }),
            password: joi_1.default.string().required().min(8).max(40)
        })
    }
};
