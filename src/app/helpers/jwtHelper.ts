import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import AppError from "../errors/AppError";

export const createToken = (
  jwtPayload: { email: string; role: string; id: string },
  secret: Secret,
  expiresIn: string,
) => {
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  });
};

export const verifyToken = (token: string, secret: Secret) => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error: any) {
    console.log(error);
    throw new AppError(StatusCodes.UNAUTHORIZED, error.message || "Invalid Token");
  }
};
