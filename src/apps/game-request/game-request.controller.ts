import { Express, NextFunction, Response, text } from 'express';
import mongoose from 'mongoose';
import User, { IUser, IUserModel } from '../user/user.models';
import { AuthRequest } from '../../middleware/Authentication';
import GameRequest, { IGameRequestModel } from './game-request.model';
import { sortEnum } from '../../models/gameSort.enum';
import { IGameFilters } from '../../models/gameFilters.interface';
import { isImageUploaded, uploadFile, fileType } from "../../library/ImageUpload";
import { gameRequestResponseDto } from './game-request.dto';
import Game, { IGameModel } from '../game/game.models';


const createGameRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameSystemId, title, description, tags, imgUrl, price, cityCode, startDateTime, maxPlayers, booked } = req.body;
  const author: IUser = req.user?._id;
  const players: IUser[] = [author];
  if (!author) {
    return;
  }

  if (!req.user?.contactData.telegram) {
    return res.status(403).json({ message: 'You don\'t have telegram-bot nickname in your profile' });
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
    bookedAmount: booked.length
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
  const { gameRequestId } = req.params;

  return GameRequest.findById(gameRequestId)
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
        if (gameRequest.startDateTime >= new Date()) {
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
        .populate([{path: 'creator', select: 'username name -_id verified' },
          {path: 'master', select: 'username name contactData rate -_id' },
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
        .populate([{path: 'creator', select: 'username -_id verified' },
          {path: 'master', select: 'username name rate -_id' },
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
      .populate([{path: 'creator', select: 'username -_id' },
        {path: 'master', select: 'username name rate -_id' },
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


function sortGameRequests (sort: number, filters: IGameFilters, onlyFutureGames: boolean = false) {
  let dateFilter = {};
  let searchField = {};
  let isShowSuspended = {};
  let gameSystemId = {};
  let cityCode = {};
  let creator = {};
  let master = {};
  let player = {};
  if (filters.search) {
    searchField = { $text: { $search: filters.search } };
  }
  if (!filters.isShowSuspended) {
    isShowSuspended = {isSuspended: false}
  }
  if ((filters.gameSystemId && !isNaN(filters.gameSystemId)) || filters.gameSystemId === 0) {
    gameSystemId = {gameSystemId: filters.gameSystemId}
  }
  if ((filters.cityCode && !isNaN(filters.cityCode)) || filters.cityCode === 0) {
    cityCode = {cityCode: filters.cityCode}
  }
  if (filters.creator) {
    creator = { creator: filters.creator }
  }
  if (filters.master) {
    master = { master: filters.master }
  }
  if (filters.player) {
    player = { players: filters.player }
  }


  const lastDaysToTakeGames = 90;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - lastDaysToTakeGames);
  if (onlyFutureGames) {
    dateFilter = { startDateTime: { $gt: d }}
  }
  const query = { ...dateFilter, ...cityCode, ...gameSystemId, ...isShowSuspended, ...searchField, ...creator, ...master, ...player };
  // const query = { createdAt: { $gt: d }, ...cityCode, ...gameSystemId, ...isShowSuspended, ...searchField, ...master, ...player };
  // to show only future game, uncomment this and comment 2 upper rows
  return GameRequest.find(query)
    .sort('isSuspended')
    .sort('-suspendedDateTime')
    .sort(sort === sortEnum.new ? '-createdAt' : 'startDateTime');
}

const applyGameRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  const player: IUser | null | undefined = req.user;
  if (!player) {
    return;
  }
  if (!req.user?.contactData.telegram) {
    return res.status(403).json({ message: 'You need to have telegram-bot nickname in your profile' });
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

export default { createGameRequest, readGameRequest, readAll, updateGameRequest, applyGameRequest };
