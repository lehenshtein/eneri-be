import { Express, NextFunction, Response, text } from 'express';
import mongoose from 'mongoose';
import { IUser, IUserModel } from '../user/user.models';
import { AuthRequest } from '../../middleware/Authentication';
import GameRequest, { IGameRequestModel } from './game-request.model';
import { sortEnum } from '../../models/gameSort.enum';
import { isImageUploaded, uploadFile, fileType } from "../../library/ImageUpload";
import { gameRequestResponseDto } from './game-request.dto';
import { sortGameRequests } from "./game-request.lib";


const createGameRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameSystemId, title, description, tags, imgUrl, price, cityCode, startDateTime, maxPlayers, booked, linkOnly, organizedPlay } = req.body;
  const author: IUser = req.user?._id;
  const players: IUser[] = [author];
  if (!author) {
    return;
  }

  if (!req.user?.contactData.telegram) {
    return res.status(403).json({ message: 'You don\'t have telegram nickname in your profile' });
  }

  const gameRequest = new GameRequest({
    _id: new mongoose.Types.ObjectId(),
    creator: author,
    gameSystemId,
    title,
    description,
    imgUrl,
    tags,
    cityCode,
    price,
    startDateTime,
    players,
    maxPlayers,
    booked,
    bookedAmount: booked.length,
    linkOnly,
    organizedPlay
  });

  if (gameRequest.imgUrl || req.files?.length) {
    if (!gameRequest.imgUrl || !isImageUploaded(gameRequest.imgUrl)) {
      const uploadResult = await uploadFile(req.files as fileType, gameRequest.imgUrl);
      if (uploadResult.result) {
        gameRequest.imgUrl = uploadResult.imgUrl as string;
      } else {
        return res.status(400).json({ message: uploadResult.message });
      }
    }
  }

  return gameRequest.save()
    .then(gameRequest => res.status(201).json(gameRequestResponseDto(gameRequest, req.user!.username)))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};


const updateGameRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;

  return GameRequest.findById(gameId)
    .then(async gameRequest => {
      if (gameRequest) {
        if (!gameRequest.creator._id.equals(req.user?._id)) {
          return res.status(403).json({ message: 'Not your game' });
        }

        req.body.bookedAmount = req.body.booked.length;
        gameRequest.set(req.body);

        if (gameRequest.imgUrl || req.files?.length) {
          if (!gameRequest.imgUrl || !isImageUploaded(gameRequest.imgUrl)) {
            const uploadResult = await uploadFile(req.files as fileType, gameRequest.imgUrl);
            if (uploadResult.result) {
              gameRequest.imgUrl = uploadResult.imgUrl as string;
            } else {
              return res.status(400).json({ message: uploadResult.message });
            }
          }
        }

        // reopen games if start date was updated
        if (gameRequest.startDateTime && gameRequest.startDateTime >= new Date()) {
          gameRequest.isSuspended = false;
          gameRequest.suspendedDateTime = undefined;
        }

        return gameRequest.save()
          .then(gameRequest => res.status(201).json(gameRequest))
          .catch(err => res.status(500).json({ message: 'Server error', err }));
      } else {
        return res.status(404).json({ message: 'not found' });
      }
    })
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};


const readGameRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const isCreator = req.query.creator;
  const { gameId } = req.params;
  const player: IUser | null | undefined = req.user;

  if (isCreator === 'true') {
    try {
      const gameRequest: IGameRequestModel | null = await GameRequest.findById(gameId)
        .populate([{path: 'creator', select: 'username name -_id verified avatar' },
          {path: 'master', select: 'username name contactData rate -_id avatar' },
          {path: 'players', select: 'username -_id contactData name verified' }])
        .select('-__v');// get rid of field
      if (!gameRequest) {
        return res.status(404).json({ message: 'not found' });
      }

      if (gameRequest.creator.username === player?.username) {
        return res.status(200).json(gameRequest);
      } else {
        return res.status(401).json({message: 'You do not have permissions'});
      }
    } catch (err) {
      return res.status(500).json({ message: 'Server error', err });
    }
  }
  else {
    try {
      const gameRequest: IGameRequestModel | null = await GameRequest.findById(gameId)
        .populate([{path: 'creator', select: 'username -_id verified avatar' },
          {path: 'master', select: 'username name rate -_id avatar' },
          {path: 'players', select: 'username -_id verified' }])
        .select('-booked -__v');// get rid of field
      if (!gameRequest) {
        return res.status(404).json({ message: 'not found' });
      }
      return res.status(200).json(gameRequest);
    } catch (err) {
      return res.status(500).json({ message: 'Server error', err });
    }
  }
};


const readAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const page = req.query.page || 0;
  const limit = req.query.limit || 10;
  const sort = req.query.sort || sortEnum.closestDate;
  const filters = {
    search: req.query.search as string || '',
    isShowSuspended: (req.query.isShowSuspended as string)?.toLowerCase() === 'true',
    gameSystemId: req.query.gameSystemId ? +req.query.gameSystemId : null,
    cityCode: req.query.cityCode ? +req.query.cityCode : null
  }

  try {
    let gameRequests: IGameRequestModel[] = await sortGameRequests(+sort, filters, true)
      .limit(+limit)
      .skip((+page) * +limit)
      .populate([{path: 'creator', select: 'username -_id avatar' },
        {path: 'master', select: 'username name rate -_id avatar' },
        {path: 'players', select: 'username -_id' }])
      .select('-booked -__v'); // get rid of field
    let total = await sortGameRequests(+sort, filters, true).count(); //make true for future games only

    res.header('X-Page', page.toString());
    res.header('X-Limit', limit.toString());
    res.header('X-Total', total.toString());
    return res.status(200).json(gameRequests);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const applyGameRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  const player: IUser | null | undefined = req.user;
  if (!player) {
    return;
  }
  if (!req.user?.contactData.telegram) {
    return res.status(403).json({ message: 'You need to have telegram nickname in your profile' });
  }

  try {
    const game: IGameRequestModel | null = await GameRequest.findById(gameId)
      .populate('master', '-_id name username')
      .select('-__v');
    if (!game) {
      return res.status(404).json({ message: 'not found' });
    }
    if (game.players.length >= game.maxPlayers) {
      return res.status(405).json({ message: 'No more players allowed' });
    }
    if (game.master?.username === player.username) {
      return res.status(405).json({ message: 'You are master of this game' });
    }
    if (game.players.find(player => player._id.equals(req.user!._id))) {
      return res.status(405).json({ message: 'You are already applied' });
    }
    if (game.bookedAmount) {
      const bookedUserIndex = game.booked.findIndex((telegram: string) => telegram.toLowerCase() === req.user?.contactData.telegram?.toLowerCase());
      if (bookedUserIndex !== -1) {
        const newBookedPlayers = [...game.booked];
        newBookedPlayers.splice(bookedUserIndex, 1);
        game.booked = [...newBookedPlayers];
        game.bookedAmount -= 1;
      } else if ((game.players.length + game.bookedAmount) >= game.maxPlayers) {
        return res.status(405).json({ message: 'Залишились тільки зарезервовані місця' });
      }
    }

    if (game.players.length === (game.maxPlayers - 1)) {
      game.isSuspended = true;
      game.suspendedDateTime = new Date();
    }
    game.players.push(player);
    await game.save();

    return res.status(200).json({message: 'success'});
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
}

const applyGameRequestAsMaster = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  const user: IUser | null | undefined = req.user;
  if (!user) {
    return;
  }
  if (!req.user?.contactData.telegram || !req.user?.showContacts) {
    return res.status(403).json({ message: 'You need to have telegram nickname in your profile and activate contacts visibility' });
  }

  try {
    const game: IGameRequestModel | null = await GameRequest.findById(gameId)
      .populate([ {path: 'master', select: '-_id name username'}, {path: 'creator', select: '_id username' }])
      .select('-__v');
    if (!game) {
      return res.status(404).json({ message: 'not found' });
    }
    if (game.creator?.username === user.username) {
      return res.status(405).json({ message: 'You are creator of this game' });
    }
    if (game.master?.username === user.username) {
      return res.status(405).json({ message: 'You are master of this game' });
    }
    if (game.players.find(player => player._id.equals(req.user!._id))) {
      return res.status(405).json({ message: 'You are already applied as a player' });
    }

    if (game.players.length === (game.maxPlayers)) {
      game.isSuspended = true;
      game.suspendedDateTime = new Date();
    }
    game.master = user;
    await game.save();

    return res.status(200).json({message: 'success'});
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
}

const removePlayerFromGameRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  const { username } = req.params;
  const user: IUserModel | null | undefined = req.user;
  if (!user) {
    return;
  }

  try {
    const game: IGameRequestModel | null = await GameRequest.findById(gameId)
      .populate([{path: 'creator', select: '_id username' }, {path: 'players', select: 'username _id name contactData' }])
      .select('-__v');

    if (!game) {
      return res.status(404).json({ message: 'not found' });
    }
    if (!game?.creator._id.equals(user?._id)) {
      return res.status(401).json({ message: 'You have no permissions' });
    }
    if (game?.creator.username === username) {
      return res.status(403).json({ message: 'You cannot remove creator' });
    }


    const playerIndex = game?.players.findIndex(player => player.username === username);

    if (playerIndex !== -1) {
      const newPlayers = [...game?.players];
      newPlayers.splice(playerIndex, 1);
      game.players = [...newPlayers];
    }

    if (game.players.length < game.maxPlayers) {
      game.isSuspended = false;
    }

    await game.save();

    return res.status(200).json({message: 'success'});
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
}

const removeMasterFromGameRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  const user: IUserModel | null | undefined = req.user;
  if (!user) {
    return;
  }

  try {
    const game: IGameRequestModel | null = await GameRequest.findById(gameId)
      .populate([{path: 'creator', select: '_id username' }])
      .select('-__v');

    if (!game) {
      return res.status(404).json({ message: 'not found' });
    }
    if (!game?.creator._id.equals(user?._id)) {
      return res.status(401).json({ message: 'You have no permissions' });
    }
    if (!game?.master) {
      return res.status(403).json({ message: 'There is no master' });
    }

    game.master = undefined;
    await game.save();

    return res.status(200).json({message: 'success'});
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
}

export default { createGameRequest, readGameRequest, readAll, updateGameRequest, applyGameRequest, removePlayerFromGameRequest, removeMasterFromGameRequest, applyGameRequestAsMaster };
