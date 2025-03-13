import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { USER_ROLE } from "../../enums";
import AppError from "../../errors/AppError";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { sendNotification } from "../../shared/sendNotification";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";

const createWithdrawal = async (
  user: TTokenUser,
  payload: { coin: number; walletAddress: string },
) => {
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
      walletAddress: payload.walletAddress,
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

const updateWithdrawal = async (
  user: TTokenUser,
  id: string,
  payload: Prisma.WithdrawalUpdateInput,
) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    const result = await transactionClient.withdrawal.update({
      where: { id, userId: user.id },
      data: payload,
    });

    return result;
  });
  return result;
};

const makePayment = async (id: string) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    const result = await transactionClient.withdrawal.update({
      where: { id },
      data: { isPaid: true },
    });

    await transactionClient.user.update({
      where: {
        id: result.userId,
      },
      data: {
        totalCoins: {
          decrement: result.coin,
        },
      },
    });

    return result;
  });
  return result;
};

export const WithdrawalService = {
  createWithdrawal,
  getWithdrawal,
  getMyWithdrawal,
  makePayment,
  updateWithdrawal,
};
