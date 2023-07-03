import { IGameSystem } from './GameSystem.interface';
import { ICity } from './City.interface';
import { IUserModel } from '../apps/user/user.models';

export interface ICommonGame {
  gameSystemId: IGameSystem['_id'];
  title: string;
  description: string;
  organizedPlay: boolean;
  imgUrl: string;
  tags: string[];
  cityCode: ICity['code'];
  price: number;
  isSuspended: boolean;
  suspendedDateTime: Date | undefined;
  startDateTime: Date | undefined;
  players: Partial<IUserModel>[];
  maxPlayers: number;
  booked: string[];
  bookedAmount: number;
  linkOnly: boolean;
}
