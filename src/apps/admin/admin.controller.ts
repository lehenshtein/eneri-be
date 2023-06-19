import { AuthRequest } from '../../middleware/Authentication';
import { NextFunction, Response } from 'express';
import User from '../user/user.models';
import Crypto from 'crypto';

const getUserForAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  //:TODO create middleware for roles, controller for admin requests
  if (req.user?.role !== 'superAdmin' && req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
    return res.status(403).json({ message: 'You have no permissions' });
  }
  const { usernameOrEmail } = req.params;
  const isUsername = !usernameOrEmail.includes('@');

  try {
    let user;
    if (isUsername) {
      user = await User.findOne({ username: { $regex: new RegExp('^'+ usernameOrEmail + '$', "i") } }, '-_id -verificationKey');
    } else {
      user = await User.findOne({ email: { $regex: new RegExp('^'+ usernameOrEmail + '$', "i") } }, '-_id -verificationKey');
    }

    if (!user) {
      return res.status(404).json({ message: 'not found' });
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  //:TODO create middleware for roles, controller for admin requests
  if (req.user?.role !== 'superAdmin' && req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
    return res.status(403).json({ message: 'You have no permissions' });
  }

  try {
    let totalUsers = await User.find().count();
    let totalMasters = await User.find({gameRole: 'both'}).count()

    return res.status(200).json({totalUsers, totalMasters});
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const changeGameRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  //:TODO create middleware for roles, controller for admin requests
  if (req.user?.role !== 'superAdmin' && req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
    return res.status(403).json({ message: 'You have no permissions' });
  }
  const { username } = req.params;

  try {
    const user = await User.findOne({username}, '-verificationKey');
    if (!user) {
      return res.status(404).json({message: 'not found'});
    }
    if (user.gameRole === 'player') {
      user.gameRole = 'both';
    } else {
      user.gameRole = 'player';
    }
    await user.save();
    return res.status(200).json(user.gameRole)
  } catch(err) {
    return res.status(500).json({ message: 'Server error', err });
  }
}
const changeEmailVerification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  //:TODO create middleware for roles, controller for admin requests
  if (req.user?.role !== 'superAdmin' && req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
    return res.status(403).json({ message: 'You have no permissions' });
  }
  const { username } = req.params;

  try {
    const user = await User.findOne({username}, '-verificationKey');
    if (!user) {
      return res.status(404).json({message: 'not found'});
    }
    user.verified = !user.verified;
    if (user.verified) {
      user.verificationDate = new Date();
    }
    user.verificationKey = Crypto.randomBytes(4).toString('hex');
    await user.save();
    return res.status(200).json({verificationDate: user.verificationDate, verified: user.verified})
  } catch(err) {
    return res.status(500).json({ message: 'Server error', err });
  }
}

export default { getUserForAdmin, changeGameRole, changeEmailVerification, getStats };
