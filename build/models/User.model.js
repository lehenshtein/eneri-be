"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: false, unique: false },
    username: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, required: true, unique: true },
    confirmedEmail: { type: Boolean, required: true, default: false },
    password: { type: String, required: true, select: false },
    salt: { type: String, required: true, select: false },
    birthDate: { type: Date, required: false },
    gameRole: { type: String, required: true, default: 'player' },
    gamesLeaded: { type: Number, required: true, default: 0 },
    gamesPlayed: { type: Number, required: true, default: 0 },
    role: { type: String, required: true, default: 'user' },
    rate: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, default: 'default' },
    statusTillDate: { type: Date, required: false },
    contactData: {
        city: {
            code: { type: Number, required: false },
            name: { type: String, required: false },
        },
        phone: { type: Number, required: false },
        telegram: { type: String, required: false }
    },
    avatar: { type: String, required: false, default: '' }
}, {
    versionKey: false,
    timestamps: true
});
exports.default = mongoose_1.default.model('User', UserSchema);
