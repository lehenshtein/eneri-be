"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const User_controller_1 = __importDefault(require("../controllers/User.controller"));
const Authentication_1 = require("../middleware/Authentication");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('', [Authentication_1.requireAuthentication], User_controller_1.default.getUser);
router.get('/:username', User_controller_1.default.getUserByUsername);
module.exports = router;
