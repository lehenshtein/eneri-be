import mongoose, { Document, Schema } from 'mongoose';
import { IUserModel } from './User.model';
import { IGameSystem } from './GameSystem.interface';
import { ICity } from './City.interface';

export interface IGame {
  master: Partial<IUserModel>;
  gameSystemId: IGameSystem['_id'];
  title: string;
  description: string;
  imgUrl: string;
  tags: string[];
  cityCode: ICity['code'];
  price: number;
  byInvite: boolean;
  isSuspended: boolean;
  startDateTime: Date;
  players: Partial<IUserModel>[];
  maxPlayers: number;
  booked: string[];
  bookedAmount: number;
}

export interface IGameModel extends IGame, Document {}

const GameSchema: Schema = new Schema({
  master: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  gameSystemId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  tags: { type: [String], required: false },
  imgUrl: { type: String, required: false },
  price: { type: Number, required: true },
  cityCode: { type: Number, required: true },
  byInvite: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  startDateTime: { type: Date, required: true,  default: new Date().getTime() },
  players: { type: [Schema.Types.ObjectId], required: false, default: [], ref: 'User' },
  maxPlayers: { type: Number, required: true, default: 1 },
  booked: { type: [String], required: false, default: [] },
  bookedAmount: { type: Number, required: false, default: 0 },
}, { timestamps: true });

GameSchema.index({ title: 'text', 'master.username': 'text', tags: 'text' },
  { name: 'Games_text_index', weights: { title: 30, tags: 20, 'master.username': 10 } });

export default mongoose.model<IGameModel>('Game', GameSchema);
