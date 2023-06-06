import { IGameFilters } from "../../models/gameFilters.interface";
import Game, {IGameModel} from "./game.models";
import { sortEnum } from "../../models/gameSort.enum";
import { sortGameRequests } from "../game-request/game-request.lib";
import {IGameRequestModel} from "../game-request/game-request.model";

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


  const lastDaysToTakeGames = 90;
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


async function combineGamesAndRequests(sort: number, page: number, limit: number, filters: IGameFilters, onlyFutureGames: boolean = false) {
  const start = sort * limit;
  const end = start + limit;

  const games: IGameModel[] = await sortGames(+sort, filters)
    .limit(end)
    .populate([{path: 'master', select: 'username name rate -_id' }, {path: 'players', select: 'username -_id' }])
    .select('-__v'); // get rid of field
  let totalGames = await sortGames(+sort, filters).count();

  const gameRequests: IGameRequestModel[] = await sortGameRequests(+sort, filters, onlyFutureGames)
    .limit(end)
    .populate([{path: 'creator', select: 'username -_id' },
      {path: 'master', select: 'username name rate -_id' },
      {path: 'players', select: 'username -_id' }])
    .select('-booked -__v'); // get rid of field
  let totalRequests = await sortGameRequests(+sort, filters, onlyFutureGames).count();

  let result = [];
  let game_counter = 0;
  let request_counter = 0;

  // iterate until got enough items or went through all games and requests
  while (result.length < end && (game_counter < games.length || request_counter < gameRequests.length)) {
    let nextGame = games[game_counter];
    let nextRequest = gameRequests[request_counter];
    let addGame = false;

    if (nextGame && nextRequest) {
      if (nextGame.isSuspended !== nextRequest.isSuspended) {
        if (nextGame.isSuspended < nextRequest.isSuspended)
            addGame = true;
      } else if (nextGame.suspendedDateTime !== nextRequest.suspendedDateTime) {
        if (nextGame.suspendedDateTime && nextRequest.suspendedDateTime && nextGame.suspendedDateTime > nextRequest.suspendedDateTime) {
          addGame = true;
        }
      } else if (nextGame.startDateTime < nextRequest.startDateTime) {
        addGame = true;
      }
    }

    if (addGame || !nextRequest) {
      game_counter++;
      result.push(nextGame);
    } else {
      request_counter++;
      result.push(nextRequest);
    }
  }

  return { games: result.slice(start, end), total: totalGames + totalRequests }
}

export { sortGames, combineGamesAndRequests };
