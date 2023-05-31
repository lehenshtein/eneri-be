import mongoose, { Document, Schema } from 'mongoose';

export interface IChat {
  tgUserId: number;
  username?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
}

export interface IChatModel extends IChat, Document {
}

const ChatSchema = new Schema({
  tgUserId: { type: Number, required: true, unique: true },
  firstName: { type: String, default: '', required: false, unique: false },
  lastName: { type: String, default: '', required: false, unique: false },
  username: { type: String, default: '', required: false, unique: false },
},
  {
    versionKey: false,
    timestamps: true
  })

export default mongoose.model('IChat', ChatSchema);
