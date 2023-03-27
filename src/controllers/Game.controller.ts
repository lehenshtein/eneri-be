import { Express, NextFunction, Response, text } from 'express';
import mongoose from 'mongoose';
import User, { IUser, IUserModel } from '../models/User.model';
import { AuthRequest } from '../middleware/Authentication';
import Game, { IGameModel } from '../models/Game.model';
import { sort } from '../models/gameSort.type';
import Logger from '../library/logger';
import { IGameFilters } from '../models/gameFilters.interface';


const createGame = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameSystemId, title, description, tags, imgUrl, price, cityCode, byInvite, startDateTime, maxPlayers } = req.body;
  const author: IUser = req.user?._id;
  if (!author) {
    return;
  }
  if (req.user?.status === 'banned' || req.user?.status === 'muted') {
    return res.status(403).json({ message: 'You were banned or muted' });
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
    maxPlayers
  });

  return game.save()
    .then(game => res.status(201).json(game))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const updateGame = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;

  return Game.findById(gameId)
    .then(async game => {
      if (game) {
        if (game.master._id !== req.user?._id) {
          return res.status(403).json({ message: 'Not your game' });
        }

        game.set(req.body);

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
  const { gameId } = req.params;

  try {
    const game: IGameModel | null = await Game.findById(gameId)
      .populate('master', '-_id name')// form ref author we get author obj and can get his name
      .select('-__v');// get rid of field
    if (!game) {
      return res.status(404).json({ message: 'not found' });
    }

    return res.status(200).json(game);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const readAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const sort: sort = req.query.sort as sort || undefined;
  const filters = {
    search: req.query.search as string || '',
    isShowSuspended: (req.query.isShowSuspended as string)?.toLowerCase() === 'true'
  }

  try {
    let games: IGameModel[] = await sortGames(sort, filters)
      .limit(+limit)
      .skip((+page - 1) * +limit)
      .populate([{path: 'master', select: 'username rate -_id' }, {path: 'players', select: 'username -_id' }])
      .select('-__v'); // get rid of field

    res.header('X-Page', page.toString());
    res.header('X-Limit', limit.toString());
    return res.status(200).json(games);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const applyGame = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  const player: IUser = req.user?._id;
  if (!player) {
    return;
  }
  if (req.user?.status === 'banned') {
    return res.status(403).json({ message: 'You were banned' });
  }

  try {
    const game: IGameModel | null = await Game.findById(gameId)
      .populate('master', '-_id name')
      .select('-__v');
    if (!game) {
      return res.status(404).json({ message: 'not found' });
    }
    if (game.players.length >= game.maxPlayers) {
      return res.status(405).json({ message: 'No more players allowed' });
    }
    if (game.players.find(player => player._id.equals(req.user!._id))) {
      return res.status(405).json({ message: 'You are already applied' });
    }


    if (game.players.length === (game.maxPlayers - 1)) {
      game.isSuspended = true;
    }
    game.players.push(player);
    await game.save();

    return res.status(200).json({message: 'success'});
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
}

  const getGamesForMaster = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;
  const { username } = req.params;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const sort: sort = undefined;

  let masterId;
  if (username && username !== 'undefined') {
    try {
      masterId = await User.findOne({ username }, '_id');
      if (!masterId) {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Server error', err });
    }
  } else {
    return res.status(400).json({ message: 'Invalid username' });
  }

  try {
    const games: IGameModel[] = await Game.find({ master: masterId })
      .sort(sort)
      .limit(+limit)
      .skip((+page - 1) * +limit)
      .populate('author', 'name -_id')
      .select('-__v'); // get rid of field

    res.header('X-Page', page.toString());
    res.header('X-Limit', limit.toString());

    return res.status(200).json(games);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

function sortGames (sort: sort, filters: IGameFilters) {
  let searchField = {};
  let isShowSuspended = {};
  if (filters.search) {
    searchField = { $text: { $search: filters.search } };
  }
  if (!filters.isShowSuspended) {
    isShowSuspended = {isSuspended: false}
  }

  if (sort === 'date') {
    return Game.find(searchField)
      .sort('-startDateTime');
  }
  if (sort === 'rate') {
    return Game.find(searchField)
      .sort('-master.rate');
  }
  const lastDaysToTakeGames = 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - lastDaysToTakeGames);
  return Game.find({ createdAt: { $gt: d }, ...isShowSuspended, ...searchField })
    .sort('-createdAt');
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

export default { createGame, readGame, readAll, applyGame, updateGame, deleteGame, getGamesForMaster };
