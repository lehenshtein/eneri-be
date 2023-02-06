"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const Authentication_controller_1 = __importDefault(require("../controllers/Authentication.controller"));
const ValidateSchema_1 = require("../middleware/ValidateSchema");
const router = express_1.default.Router();
router.post('/login', (0, ValidateSchema_1.ValidateSchema)(ValidateSchema_1.Schema.authentication.login), Authentication_controller_1.default.login);
router.post('/register', (0, ValidateSchema_1.ValidateSchema)(ValidateSchema_1.Schema.authentication.register), Authentication_controller_1.default.register);
module.exports = router;
