import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { USER_ROLE } from "../../enums";
import { sendNotification } from "../../shared/sendNotification";
import { TPaginationOptions } from "../../types/pagination";
import { Prisma } from "@prisma/client";
import { paginationHelper } from "../../helpers/paginationHelper";

const createWithdrawal = async (user: TTokenUser, payload: { coin: number }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email, id: user.id },
  });

  if (userData.totalCoins < payload.coin) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient coins");
  }

  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId: userData.id,
      coin: payload.coin,
    },
  });

  // SEND A NOTIFICATION IN ADMIN DASHBOARD
  const admin = await prisma.user.findFirst({ where: { role: USER_ROLE.SUPER_ADMIN } });

  if (admin?.fcmToken) {
    sendNotification([admin.fcmToken], {
      title: "New Withdrawal Request",
      body: `User ${userData.firstName || "Unknown User"} has requested a withdrawal of ${
        payload.coin
      } coins.`,
      userId: admin.id,
    });
  }

  return withdrawal;
};

const getWithdrawal = async (query: Record<string, unknown>, options: TPaginationOptions) => {
  const andConditions: Prisma.WithdrawalWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterQuery } = query;

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          user: {
            email: {
              contains: searchTerm.toString(),
              mode: "insensitive",
            },
            fullName: {
              contains: searchTerm.toString(),
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([field, value]) => ({
        [field]: {
          equals: value,
        },
      })),
    });
  }

  const whereConditions = andConditions?.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.withdrawal.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.withdrawal.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getMyWithdrawal = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const andConditions: Prisma.WithdrawalWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterQuery } = query;

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          user: {
            email: {
              contains: searchTerm.toString(),
              mode: "insensitive",
            },
            fullName: {
              contains: searchTerm.toString(),
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([field, value]) => ({
        [field]: {
          equals: value,
        },
      })),
    });
  }

  const whereConditions =
    andConditions?.length > 0 ? { AND: andConditions, userId: user.id } : { userId: user.id };

  const result = await prisma.withdrawal.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.withdrawal.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const makePayment = async (id: string) => {
  const result = await prisma.withdrawal.update({ where: { id }, data: { isPaid: true } });
  return result;
};

export const WithdrawalService = { createWithdrawal, getWithdrawal, getMyWithdrawal, makePayment };
