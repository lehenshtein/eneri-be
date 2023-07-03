import mongoose, { Document, Schema } from 'mongoose';
import { IUserModel } from '../user/user.models';
import { ITimestamp } from '../../models/timestamp.interface';
import { ICommonGame } from '../../models/commonGame.interface';

export interface IGameRequest extends ICommonGame {
  master: Partial<IUserModel> | undefined;
  creator: Partial<IUserModel>;
}

export interface IGameRequestModel extends IGameRequest, ITimestamp, Document {}

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
  linkOnly: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspendedDateTime: { type: Date, required: false },
  startDateTime: { type: Date, required: false },
  players: { type: [Schema.Types.ObjectId], required: true, default: [], ref: 'User' },
  maxPlayers: { type: Number, required: true, default: 1 },
  booked: { type: [String], required: false, default: [] },
  bookedAmount: { type: Number, required: false, default: 0 },
}, { timestamps: true });

GameRequestSchema.index({ title: 'text', tags: 'text' },
  { name: 'Game_requests_text_index', weights: { title: 30, tags: 20, 'master.username': 10 } });

export default mongoose.model<IGameRequestModel>('GameRequest', GameRequestSchema);
