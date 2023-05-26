import { IUserAsMaster, IUserAsPlayer, IUserModel } from './user.models';

export const userAsMasterDto = (user: IUserModel): IUserAsMaster => {
  return {
    username: user.username,
    gameRole: user.gameRole,
    name: user.name,
    about: user.about,
    gamesLeaded: user.gamesLeaded,
    gamesPlayed: user.gamesPlayed,
    telegram: user.showContacts ? user.contactData.telegram : '',
    avatar: user.avatar,
    createdAt: user.createdAt,
  }
}
export const userAsPlayerDto = (user: IUserModel): IUserAsPlayer => {
  return {
    username: user.username,
    name: user.name,
    gameRole: user.gameRole,
    about: user.about,
    gamesPlayed: user.gamesPlayed,
    avatar: user.avatar,
    createdAt: user.createdAt,
  }
}
