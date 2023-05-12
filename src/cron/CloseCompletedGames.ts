import Game from '../models/Game.model';

export async function closeCompletedGames () {
  const hoursToClose = 1;
  const d = new Date();
  d.setTime(d.getTime() - hoursToClose * 60 * 60 * 1000);
  console.log('Closing games which started before ' + d.toString());
  try {
    const result = await Game.updateMany(
        {'startDateTime': {'$lte': d}, 'isSuspended': false},
        {'$set': {'isSuspended': true}},
    );
    console.log(result);
  } catch (err) {
    console.log(err);
  }
}