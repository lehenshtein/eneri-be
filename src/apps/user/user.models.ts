import mongoose, { Document, Schema } from 'mongoose';
import { gameRoles } from '../../models/gameRoles.type';
import { roles } from '../../models/roles.type';

export interface IUser {
  name: string,
  username: string,
  email: string,
  password: string,
  salt: string,
  about: string,
  birthDate: Date,
  role: roles,
  gameRole: gameRoles,
  gamesLeaded: number,
  gamesPlayed: number,
  rate: number,
  status: 'default' | 'muted' | 'banned',
  statusTillDate: Date | null,
  contactData: IContactData,
  showContacts: boolean,
  avatar: string,
  updatedAt: Date,
  createdAt: Date,
  verified: boolean,
  verificationKey: string,
  verificationDate: Date,
  fullAccessCode: string,
}
interface IContactData {
  city: { name: string, code: number } | undefined,
  phone: string | undefined,
  telegram: string | undefined
}

export interface IUserAsMaster {
  name: string,
  username: string,
  gameRole: gameRoles,
  about: string,
  gamesLeaded: number,
  gamesPlayed: number,
  telegram: string | undefined,
  avatar: string,
  createdAt: Date,
}
export interface IUserAsPlayer {
  name: string,
  username: string,
  gameRole: gameRoles,
  about: string,
  gamesPlayed: number,
  avatar: string,
  createdAt: Date,
}

export interface IUserModel extends IUser, Document {
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: false, unique: false },
    username: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, required: true, unique: true },
    password: { type: String, required: true, select: false },
    salt: { type: String, required: true, select: false },
    about: { type: String, required: false, default: '', maxlength: 600 },
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
      phone: { type: String, required: false },
      telegram: { type: String, required: false }
    },
    showContacts: { type: Boolean, default: false, required: false },
    avatar: { type: String, required: false, default: '' },
    verified: { type: Boolean, required: true, default: false },
    verificationKey: { type: String, required: true },
    verificationDate: { type: Date, required: true, default: new Date() },
    fullAccessCode: { type: String, required: false, default: '' },
  },
  {
    versionKey: false,
    timestamps: true
  }
);

export default mongoose.model<IUserModel>('User', UserSchema);
