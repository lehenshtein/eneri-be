import { AuthRequest } from '../middleware/Authentication';
import { NextFunction, Request, Response } from 'express';
import User, { IUser, IUserAsMaster, IUserModel } from '../models/User.model';

const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return;
  }

  try {
    const user = await User.findById(req.user._id, '-_id -verificationKey -email');
    if (!user) {
      return res.status(404).json({ message: 'not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const getUserByUsername = async (req: Request, res: Response, next: NextFunction) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }, '-_id -verificationKey -email');
    if (!user) {
      return res.status(404).json({ message: 'not found' });
    }
    if (user.gameRole === 'player') {
      return res.status(404).json({ message: 'Такого майстре не знайдено, можливо це гравець' });
    }

    let userAsMaster: IUserAsMaster = {
      username: user.username,
      name: user.name,
      about: user.about,
      gamesLeaded: user.gamesLeaded,
      gamesPlayed: user.gamesPlayed,
      telegram: user.showContacts ? user.contactData.telegram : '',
      avatar: user.avatar,
      createdAt: user.createdAt,
    }
    return res.status(200).json(userAsMaster);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const editUser = async(req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (req.user.gameRole === 'player') {
    req.body.about = '';
    req.body.showContacts = false;
  }

  try {
    const user: IUserModel | null = await User.findOneAndUpdate(req.user._id, req.body, )
      .select('-_id -verificationKey -email');
    if (!user) {
      return res.status(404).json({ message: 'not found' });
    }
    return res.status(200).json({message: 'success'});
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
}

export default { getUser, getUserByUsername, editUser };
