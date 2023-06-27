import { ObjectId } from "mongoose";

export interface IGameFilters {
  search: string;
  isShowSuspended: boolean;
  gameSystemId: number | null;
  cityCode: number | null;
  master?: ObjectId;
  creator?: ObjectId;
  player?: ObjectId;
  linkOnly?: boolean;
}
