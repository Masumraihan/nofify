import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Secret } from "jsonwebtoken";
import config from "../config";
import { TUserRole } from "../enums";
import AppError from "../errors/AppError";
import { verifyToken } from "../helpers/jwtHelper";
import prisma from "../shared/prisma";
import { TTokenUser } from "../types/common";

const auth: any = (...roles: TUserRole[]) => {
  return async (
    req: Request & {
      user?: TTokenUser;
    },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "you are not authorized");
      }

      const decodedData = verifyToken(
        token,
        config.jwt.jwtAccessTokenSecret as string,
      ) as TTokenUser;
      if (!decodedData) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "you are not authorized");
      }
      if (decodedData.role && !roles.includes(decodedData.role)) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "you are not authorized");
      }

      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id: decodedData.id,
          isDelete: false,
        },
        include: {
          validation: true,
        },
      });

      if (!user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "you are not authorized");
      }

      if (!user.isActive) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "your account is blocked");
      }

      if (user.isDelete) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "your account is deleted");
      }

      if (user.signUpMethod === "EMAIL" && !user.validation?.isVerified) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "your account is not verified");
      }

      req.user = decodedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
