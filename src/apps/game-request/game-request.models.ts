import mongoose, { Document, Schema } from 'mongoose';
import { IUserModel } from '../user/user.models';
import { IGameSystem } from '../../models/GameSystem.interface';
import { ICity } from '../../models/City.interface';

export interface IGameRequest {
  master: Partial<IUserModel>;
  creator: Partial<IUserModel>;
  gameSystemId: IGameSystem['_id'];
  title: string;
  description: string;
  organizedPlay: boolean;
  tags: string[];
  imgUrl: string;
  price: number;
  cityCode: ICity['code'];
  isSuspended: boolean;
  startDateTime: Date;
  players: Partial<IUserModel>[];
  maxPlayers: number;
  booked: string[];
  bookedAmount: number;
}

export interface IGameRequestModel extends IGameRequest, Document {}

const GameRequestSchema: Schema = new Schema({
  master: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
  creator: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  gameSystemId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  organizedPlay: { type: Boolean, required: false, default: false },
  tags: { type: [String], required: false },
  imgUrl: { type: String, required: false },
  price: { type: Number, required: true },
  cityCode: { type: Number, required: true },
  isSuspended: { type: Boolean, default: false },
  startDateTime: { type: Date, required: true,  default: new Date().getTime() },
  players: { type: [Schema.Types.ObjectId], required: true, default: [], ref: 'User' },
  maxPlayers: { type: Number, required: true, default: 1 },
  booked: { type: [String], required: false, default: [] },
  bookedAmount: { type: Number, required: false, default: 0 },
}, { timestamps: true });

GameRequestSchema.index({ title: 'text', tags: 'text' },
  { name: 'Game_requests_text_index', weights: { title: 30, tags: 20, 'master.username': 10 } });

export default mongoose.model<IGameRequestModel>('GameRequest', GameRequestSchema);
