import { Express, NextFunction, Response, text } from 'express';
import mongoose from 'mongoose';
import User, { IUser, IUserModel } from '../user/user.models';
import { AuthRequest } from '../../middleware/Authentication';
import Game, { IGameModel } from './game.models';
import { sortEnum } from '../../models/gameSort.enum';
import { IGameFilters } from '../../models/gameFilters.interface';
import { isImageUploaded, uploadFile, fileType } from "../../library/ImageUpload";


const createGame = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameSystemId, title, description, tags, imgUrl, price, cityCode, byInvite, startDateTime, maxPlayers, booked } = req.body;
  const author: IUser = req.user?._id;
  if (!author) {
    return;
  }

  if (req.user?.gameRole !== 'both') {
    return res.status(403).json({ message: 'You have no Master permissions' });
  }
  if (!req.user?.contactData.telegram) {
    return res.status(403).json({ message: 'You don\'t have telegram nickname in your profile' });
  }

  const game = new Game({
    _id: new mongoose.Types.ObjectId(),
    master: author,
    gameSystemId,
    title,
    description,
    imgUrl,
    tags,
    cityCode,
    price,
    byInvite,
    startDateTime,
    maxPlayers,
    booked,
    bookedAmount: booked.length
  });

  if (game.imgUrl || req.files?.length) {
    if (!game.imgUrl || !isImageUploaded(game.imgUrl)) {
      const uploadResult = await uploadFile(req.files as fileType, game.imgUrl);
      if (uploadResult.result) {
        game.imgUrl = uploadResult.imgUrl as string;
      } else {
        return res.status(400).json({ message: uploadResult.message });
      }
    }
  }

  const responseGame = {
    _id: game._id,
    master: {username: req.user?.username},
    gameSystemId,
    title,
    description,
    imgUrl,
    tags,
    cityCode,
    price,
    byInvite,
    startDateTime,
    maxPlayers,
    booked,
    bookedAmount: booked.length
  }

  return game.save()
    .then(game => res.status(201).json(responseGame))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const updateGame = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;

  return Game.findById(gameId)
    .then(async game => {
      if (game) {
        if (!game.master._id.equals(req.user?._id)) {
          return res.status(403).json({ message: 'Not your game' });
        }

        req.body.bookedAmount = req.body.booked.length;
        game.set(req.body);

        if (game.imgUrl || req.files?.length) {
          if (!game.imgUrl || !isImageUploaded(game.imgUrl)) {
            const uploadResult = await uploadFile(req.files as fileType, game.imgUrl);
            if (uploadResult.result) {
              game.imgUrl = uploadResult.imgUrl as string;
            } else {
              return res.status(400).json({ message: uploadResult.message });
            }
          }
        }

        // reopen games if start date was updated
        if (game.startDateTime >= new Date()) {
          game.isSuspended = false;
          game.suspendedDateTime = undefined;
        }

        return game.save()
          .then(game => res.status(201).json(game))
          .catch(err => res.status(500).json({ message: 'Server error', err }));
      } else {
        return res.status(404).json({ message: 'not found' });
      }
    })
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const readGame = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const isMaster = req.query.master;
  const { gameId } = req.params;
  const player: IUser | null | undefined = req.user;

  if (isMaster === 'true') {
    try {
      const game: IGameModel | null = await Game.findById(gameId)
        .populate([{path: 'master', select: 'username name rate -_id' }, {path: 'players', select: 'username -_id contactData name verified' }])// form ref author we get author obj and can get his name
        .select('-__v');// get rid of field
      if (!game) {
        return res.status(404).json({ message: 'not found' });
      }

      if (game.master.username === player?.username) {
        return res.status(200).json(game);
      } else {
        return res.status(401).json({message: 'You do not have permissions'});
      }
    } catch (err) {
      return res.status(500).json({ message: 'Server error', err });
    }
  }
  else {
    try {
      const game: IGameModel | null = await Game.findById(gameId)
        .populate([{path: 'master', select: 'username avatar name rate -_id' }, {path: 'players', select: 'username -_id verified' }])// form ref author we get author obj and can get his name
        .select('-booked -__v');// get rid of field
      if (!game) {
        return res.status(404).json({ message: 'not found' });
      }
      return res.status(200).json(game);
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
    let games: IGameModel[] = await sortGames(+sort, filters, true)
      .limit(+limit)
      .skip((+page) * +limit)
      .populate([{path: 'master', select: 'username name rate avatar -_id' }, {path: 'players', select: 'username -_id' }])
      .select('-booked -__v'); // get rid of field
    let total = await sortGames(+sort, filters, false).count(); //make true for future games only

    res.header('X-Page', page.toString());
    res.header('X-Limit', limit.toString());
    res.header('X-Total', total.toString());
    return res.status(200).json(games);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const applyGame = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  const player: IUser | null | undefined = req.user;
  if (!player) {
    return;
  }
  if (!req.user?.contactData.telegram) {
    return res.status(403).json({ message: 'You need to have telegram nickname in your profile' });
  }

  try {
    const game: IGameModel | null = await Game.findById(gameId)
      .populate('master', '-_id name username')
      .select('-__v');
    if (!game) {
      return res.status(404).json({ message: 'not found' });
    }
    if (game.players.length >= game.maxPlayers) {
      return res.status(405).json({ message: 'No more players allowed' });
    }
    if (game.master.username === player.username) {
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

const removePlayerFromGame = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  const { username } = req.params;
  const user: IUserModel | null | undefined = req.user;
  if (!user) {
    return;
  }

  try {
    const game: IGameModel | null = await Game.findById(gameId)
      .populate([{path: 'master', select: '_id' }, {path: 'players', select: 'username _id name contactData' }])
      .select('-__v');

    if (!game) {
      return res.status(404).json({ message: 'not found' });
    }
    if (!game?.master._id.equals(user?._id)) {
      return res.status(401).json({ message: 'You have no permissions' });
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

const getGamesForMaster = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;
  const page = req.query.page || 0;
  const limit = req.query.limit || 10;
  const sort = req.query.sort || sortEnum.closestDate;

  if (user && user.gameRole !== 'both') {
    return res.status(403).json({ message: 'You have no Master permissions' });
  }

  const filters = {
    search: req.query.search as string || '',
    isShowSuspended: (req.query.isShowSuspended as string)?.toLowerCase() === 'true',
    gameSystemId: req.query.gameSystemId ? +req.query.gameSystemId : null,
    cityCode: req.query.cityCode ? +req.query.cityCode : null,
    master: user?._id
  }

  try {
    const games: IGameModel[] = await sortGames(+sort, filters)
      .limit(+limit)
      .skip((+page) * +limit)
      .populate([{path: 'master', select: 'username name rate -_id' }, {path: 'players', select: 'username -_id' }])
      .select('-__v'); // get rid of field
    let total = await sortGames(+sort, filters).count();

    res.header('X-Page', page.toString());
    res.header('X-Limit', limit.toString());
    res.header('X-Total', total.toString());

    return res.status(200).json(games);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const getGamesForPlayer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;
  const page = req.query.page || 0;
  const limit = req.query.limit || 10;
  const sort = req.query.sort || sortEnum.closestDate;

  const filters = {
    search: req.query.search as string || '',
    isShowSuspended: (req.query.isShowSuspended as string)?.toLowerCase() === 'true',
    gameSystemId: req.query.gameSystemId ? +req.query.gameSystemId : null,
    cityCode: req.query.cityCode ? +req.query.cityCode : null,
    player: user?._id
  }

  try {
    const games: IGameModel[] = await sortGames(+sort, filters)
      .limit(+limit)
      .skip((+page) * +limit)
      .populate([{path: 'master', select: 'username name rate -_id' }, {path: 'players', select: 'username -_id' }])
      .select('-booked -__v'); // get rid of field
    let total = await sortGames(+sort, filters).count();

    res.header('X-Page', page.toString());
    res.header('X-Limit', limit.toString());
    res.header('X-Total', total.toString());

    return res.status(200).json(games);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

function sortGames (sort: number, filters: IGameFilters, onlyFutureGames: boolean = false) {
  let dateFilter = {};
  let searchField = {};
  let isShowSuspended = {};
  let gameSystemId = {};
  let cityCode = {};
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
  if (filters.master) {
    master = { master: filters.master }
  }
  if (filters.player) {
    player = {players: filters.player}
  }


  const lastDaysToTakeGames = 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - lastDaysToTakeGames);
  if (onlyFutureGames) {
    dateFilter = { startDateTime: { $gt: d }}
  }
  const query = { ...dateFilter, ...cityCode, ...gameSystemId, ...isShowSuspended, ...searchField, ...master, ...player };
  // const query = { createdAt: { $gt: d }, ...cityCode, ...gameSystemId, ...isShowSuspended, ...searchField, ...master, ...player };
  // to show only future game, uncomment this and comment 2 upper rows
  return Game.find(query)
    .sort('isSuspended')
    .sort('-suspendedDateTime')
    .sort(sort === sortEnum.new ? '-createdAt' : 'startDateTime');
}

const deleteGame = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  const user = req.user;

  if (!user || user.role !== 'superAdmin') {
    return res.status(400).json({ message: 'Not enough permissions' });
  }

  return Game.findByIdAndDelete(gameId)
    .then(game => game
      ? res.status(201).json({ message: 'deleted' })
      : res.status(404).json({ message: 'not found' }))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

export default { createGame, readGame, readAll, applyGame, updateGame, deleteGame, getGamesForMaster, getGamesForPlayer, removePlayerFromGame };
