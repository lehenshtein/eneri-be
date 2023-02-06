import mongoose, { Document, Schema } from 'mongoose';


export interface IUser {
  name: string,
  username: string,
  email: string,
  confirmedEmail: boolean,
  password: string,
  salt: string,
  birthDate: Date,
  role: 'superAdmin' | 'admin' | 'moderator' | 'user',
  gameRole: 'player' | 'both',
  gamesLeaded: number,
  gamesPlayed: number,
  rate: number,
  status: 'default' | 'muted' | 'banned',
  statusTillDate: Date | null,
  contactData: IContactData,
  avatar: string,
  updatedAt: Date,
  createdAt: Date,
}
interface IContactData {
  city: { name: string, code: number },
  phone: number,
  telegram: string
}

export interface IUserModel extends IUser, Document {
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: false, unique: false },
    username: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, required: true, unique: true },
    confirmedEmail: { type: Boolean, required: true, default: false },
    password: { type: String, required: true, select: false },
    salt: { type: String, required: true, select: false },
    birthDate: { type: Date, required: false },
    gameRole: { type: String, required: true, default: 'player' },
    gamesLeaded: { type: Number, required: true, default: 0 },
    gamesPlayed: { type: Number, required: true, default: 0 },
    role: { type: String, required: true, default: 'user' },
    rate: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, default: 'default' },
    statusTillDate: { type: Date, required: false },
    contactData: {
      city: {
        code: { type: Number, required: false },
        name: { type: String, required: false },
      },
      phone: { type: Number, required: false },
      telegram: { type: String, required: false }
    },
    avatar: { type: String, required: false, default: '' }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

export default mongoose.model<IUserModel>('User', UserSchema);
