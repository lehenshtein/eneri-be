"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = exports.AuthRoutes = void 0;
const Authentication_router_1 = __importDefault(require("./Authentication.router"));
exports.AuthRoutes = Authentication_router_1.default;
const User_router_1 = __importDefault(require("./User.router"));
exports.UserRoutes = User_router_1.default;
