import { AuthRequest } from '../../middleware/Authentication';
import { NextFunction, Request, Response } from 'express';
import User, { IUser, IUserAsMaster, IUserAsPlayer, IUserModel } from './user.models';
import Crypto from 'crypto';
import { isImageUploaded, uploadFile, fileType } from "../../library/ImageUpload";
import { userAsMasterDto, userAsPlayerDto } from './user.dto';

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

    let userToReturn: IUserAsMaster | IUserAsPlayer;
    if (user.gameRole === 'player') {
      userToReturn = userAsPlayerDto(user);
    } else {
      userToReturn = userAsMasterDto(user);
    }

    return res.status(200).json(userToReturn);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const editUser = async(req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (req.user.gameRole === 'player') {
    req.body.showContacts = false;
    req.body.fullAccessCode = '';
  }

  if (req.body.avatar || req.files?.length){
    if (!req.body.avatar || !isImageUploaded(req.body.avatar)) {
      const uploadResult = await uploadFile(req.files as fileType, req.body.avatar);
      if (uploadResult.result) {
        req.body.avatar = uploadResult.imgUrl;
      } else {
        return res.status(400).json({ message: uploadResult.message });
      }
    }
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
