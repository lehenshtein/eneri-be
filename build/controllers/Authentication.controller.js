"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_model_1 = __importDefault(require("../models/User.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const register = async (req, res, next) => {
    const { username, email, password } = req.body;
    const [nameExists, emailExists] = await Promise.all([
        User_model_1.default.findOne({ username }, '_id'),
        User_model_1.default.findOne({ email }, '_id')
    ]);
    if (nameExists) {
        return res.status(400).json({ message: 'Username is already in use' });
    }
    else if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use' });
    }
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);
    // const verificationKey = generateVerificationKey();
    // const emailData = createEmailData(verificationKey);
    const user = new User_model_1.default({
        _id: new mongoose_1.default.Types.ObjectId(),
        username,
        email,
        password: hashedPassword,
        salt,
        // verificationKey
    });
    return user.save()
        .then(() => {
        // sendMail(email, emailData);
        return res.status(201).json({ token: createToken(username, email) });
    })
        .catch((err) => res.status(500).json({ message: 'Server error', err }));
};
const login = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User_model_1.default.findOne({ email }, 'name email salt password');
    if (!user) {
        return res.status(400).json({ message: 'Invalid email/password' });
    }
    const hashedPassword = hashPassword(password, user.salt);
    if (hashedPassword === user.password) {
        return res.status(201).json({ token: createToken(user.username, user.email) });
    }
    else {
        return res.status(400).json({ message: 'Invalid email/password' });
    }
};
const generateSalt = () => {
    return crypto_1.default.randomBytes(32).toString('base64');
};
const hashPassword = (password, salt) => {
    return crypto_1.default.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('base64');
};
const createToken = (name, email) => {
    return jsonwebtoken_1.default.sign({ name, email }, process.env.JWT_SIGN_KEY || '123', { expiresIn: '7 days' });
};
exports.default = { register, login };
