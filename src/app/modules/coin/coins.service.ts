import { Coins, Prisma } from "@prisma/client";
import { TTokenUser } from "../../types/common";
import prisma from "../../shared/prisma";
import { TPaginationOptions } from "../../types/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";
import { coinsFilterableFields } from "./coins.constant";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { ASSIGN_TASK_STATUS } from "../assign-task/assignTask.constant";
import { sendNotification } from "../../shared/sendNotification";

const sendCoins = async (user: TTokenUser, payload: Coins) => {
  const assignedTask = await prisma.assignTask.findFirst({
    where: {
      id: payload.assignTaskId,
    },
    include: {
      addTask: true,
    },
  });

  if (!assignedTask) {
    throw new Error("You are not assigned to this task");
  }

  if (!assignedTask.isAccepted) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User did not accept this task");
  }

  if (assignedTask.status !== ASSIGN_TASK_STATUS.COMPLETED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Task is not completed");
  }

  return await prisma.$transaction(async (transactionClient) => {
    const result = await transactionClient.coins.create({ data: { ...payload } });

    // decrease total coins of user
    await transactionClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        totalCoins: {
          decrement: result.coin,
        },
      },
    });

    //AFTER SEND COIN NOTIFY USER
    const userData = await prisma.user.findUniqueOrThrow({
      where: { id: assignedTask.addTask?.userId },
      select: { fcmToken: true, id: true },
    });

    if (userData.fcmToken) {
      sendNotification([userData.fcmToken], {
        title: "New Coin Received",
        body: `You have received ${result.coin} coins from ${user.firstName || "Unknown"} ${
          user.lastName || "User"
        }.`,
        userId: userData.id,
      });
    }

    return result;
  });
};

const getCoins = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const andConditions: Prisma.CoinsWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  await prisma.coins.findMany({
    where: {
      assignTask: {
        addTask: {
          userId: user.id,
        },
      },
    },
  });

  if (Object.keys(query).length > 0) {
    andConditions.push({
      AND: Object.entries(query).map(([key, value]) => {
        if (coinsFilterableFields.includes(key)) {
          if (key === "isRedeemed") {
            return {
              [key]: {
                equals: value === "true" ? true : false,
              },
            };
          }

          return {
            [key]: {
              equals: value,
            },
          };
        } else {
          return {
            task: {
              [key]: {
                equals: value,
              },
            },
          };
        }
      }),
    });
  }

  const result = await prisma.coins.findMany({
    where: {
      assignTask: {
        addTask: {
          userId: user.id,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      assignTask: {
        select: {
          task: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.coins.count({
    where: {
      assignTask: {
        addTask: {
          userId: user.id,
        },
      },
    },
  });

  const meta = {
    total,
    page: page || 1,
    limit: limit || 10,
    totalPage: Math.ceil(total / (limit || 10)),
  };

  return {
    data: result,
    meta,
  };
};

const redeemCoins = async (
  user: TTokenUser,
  payload: {
    coinsId: string;
  },
) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    const result = await transactionClient.coins.update({
      where: {
        id: payload.coinsId,
        assignTask: {
          addTask: {
            userId: user.id,
          },
        },
      },
      data: {
        isRedeemed: true,
      },
    });

    // set these coins in user total coins
    await transactionClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        totalCoins: {
          increment: result.coin,
        },
      },
    });

    return result;
  });
  return result;
};

export const CoinServices = { sendCoins, getCoins, redeemCoins };
