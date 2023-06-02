import { IGameRequestModel } from './game-request.model';

export const gameRequestResponseDto = (game: IGameRequestModel, username: string) => {
  console.log(game);
  return {
    _id: game._id,
    creator: {username},
    gameSystemId: game.gameSystemId,
    title: game.title,
    description: game.description,
    imgUrl: game.imgUrl,
    tags: game.tags,
    cityCode: game.cityCode,
    price: game.price,
    startDateTime: game.startDateTime,
    players: game.price,
    maxPlayers: game.maxPlayers,
    booked: game.booked,
    bookedAmount: game.booked.length
  }
}
