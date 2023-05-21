import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUserModel } from '../user/models';
import jwt from 'jsonwebtoken';
import Crypto from 'crypto';
import { AuthRequest } from "../../middleware/Authentication";
import { sendVerificationEmail } from "../../library/EmailSender";

const register = async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body;

  const [nameExists, emailExists] = await Promise.all([
    User.findOne({ username }, '_id'),
    User.findOne({ email }, '_id')
  ]);

  if (nameExists) {
    return res.status(400).json({ message: 'Username is already in use' });
  } else if (emailExists) {
    return res.status(400).json({ message: 'Email is already in use' });
  }

  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);
  const verificationKey = generateVerificationKey();

  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    username: username.trim(),
    email,
    password: hashedPassword,
    salt,
    verificationKey,
  });
  return user.save()
    .then(() => {
      sendVerificationEmail(user.email, verificationKey);
      return res.status(201).json({ token: createToken(username, email) });
    })
    .catch((err: Error) => res.status(500).json({ message: 'Server error', err }));
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }, 'name email salt password');
  if (!user) {
    return res.status(400).json({ message: 'Invalid email/password' });
  }

  const hashedPassword = hashPassword(password, user.salt);
  if (hashedPassword === user.password) {
    return res.status(201).json({ token: createToken(user.username, user.email) });
  } else {
    return res.status(400).json({ message: 'Invalid email/password' });
  }
};

const verify = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;
  const { code } = req.params;

  if (user?.verified) {
    return res.status(403).json({ message: 'Ви вже підтвердили пошту' });
  }

  try {
    if (user?.verificationKey === code) {
      user.verified = true;
      await user.save();
      res.status(200).json({ message: 'Підтверджено' });
    } else {
      res.status(403).json({ message: 'Невірний ключ' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

const resendMail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;

  if (user?.verified) {
    return res.status(403).json({ message: 'Already verified' });
  }

  if (user) {
    const verificationKey = generateVerificationKey();
    const currentDate: Date = new Date();
    const nextEmailDate: Date = new Date(user.verificationDate.setHours(user.verificationDate.getHours() + 1));
    if (nextEmailDate > currentDate) {
      return res.status(403).json({ message: 'Please wait before sending the email again' });
    }
    user.verificationKey = verificationKey;
    user.verificationDate = currentDate;
    return user.save()
      .then(user => {
        sendVerificationEmail(user.email, verificationKey);
        return res.status(201).json(user.verificationDate);
      })
      .catch(err => res.status(500).json({ message: 'Server error', err }));
  }
};

const generateSalt = () => {
  return Crypto.randomBytes(32).toString('base64');
};

const hashPassword = (password: string, salt: string) => {
  return Crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('base64');
};

const createToken = (name: string, email: string) => {
  return jwt.sign(
    { name, email },
    process.env.JWT_SIGN_KEY || '123',
    { expiresIn: '7 days' }
  );
};

const generateVerificationKey = () => {
  return Crypto.randomBytes(4).toString('hex');
};

export default { register, login, verify, resendMail };
