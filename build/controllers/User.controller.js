"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = __importDefault(require("../models/User.model"));
const getUser = async (req, res, next) => {
    console.log(req);
    if (!req.user) {
        return;
    }
    try {
        const user = await User_model_1.default.findById(req.user._id, '-_id -verificationKey -email');
        if (!user) {
            return res.status(404).json({ message: 'not found' });
        }
        return res.status(200).json(user);
    }
    catch (err) {
        return res.status(500).json({ message: 'Server error', err });
    }
};
const getUserByUsername = async (req, res, next) => {
    const { username } = req.params;
    try {
        const user = await User_model_1.default.findOne({ username }, '-_id -verificationKey -email');
        if (!user) {
            return res.status(404).json({ message: 'not found' });
        }
        return res.status(200).json(user);
    }
    catch (err) {
        return res.status(500).json({ message: 'Server error', err });
    }
};
exports.default = { getUser, getUserByUsername };
