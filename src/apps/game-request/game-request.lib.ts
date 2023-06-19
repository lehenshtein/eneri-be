import {IGameFilters} from "../../models/gameFilters.interface";
import GameRequest from "./game-request.model";
import {sortEnum} from "../../models/gameSort.enum";

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

export { sortGameRequests }