import Game from '../apps/game/game.models';
import GameRequest from '../apps/game-request/game-request.model'

export async function closeCompletedGames () {
  const hoursToClose = 1;
  const d = new Date();
  d.setTime(d.getTime() + hoursToClose * 60 * 60 * 1000);
  console.log('Closing games which started before ' + d.toString());
  try {
    const result = await Game.updateMany(
        {'startDateTime': {'$lte': d}, 'isSuspended': false},
        {'$set': {'isSuspended': true, 'suspendedDateTime': new Date()}},
    );
    console.log('games updated');
    console.log(result);
    const request_result = await GameRequest.updateMany(
        {'startDateTime': {'$lte': d}, 'isSuspended': false},
        {'$set': {'isSuspended': true, 'suspendedDateTime': new Date()}},
    );
    console.log('game requests updated');
    console.log(request_result);
  } catch (err) {
    console.log(err);
  }
}
