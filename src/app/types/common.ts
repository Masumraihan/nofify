import { JwtPayload } from "jsonwebtoken";
import { TUserRole } from "../enums";
import { Request } from "express";

export type TTokenUser = { email: string; role: TUserRole; id: string } & JwtPayload;

export interface CustomRequest extends Request {
  user: TTokenUser;
}
