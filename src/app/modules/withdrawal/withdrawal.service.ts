import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { USER_ROLE } from "../../enums";
import { sendNotification } from "../../shared/sendNotification";

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

const getWithdrawal = async () => {
  const withdrawal = await prisma.withdrawal.findMany({});

  return withdrawal;
};

const getMyWithdrawal = async (user: TTokenUser) => {
  const withdrawal = await prisma.withdrawal.findMany({ where: { userId: user.id } });

  return withdrawal;
};

const makePayment = async (id: string) => {
  const result = await prisma.withdrawal.update({ where: { id }, data: { isPaid: true } });
  return result;
};

export const WithdrawalService = { createWithdrawal, getWithdrawal, getMyWithdrawal, makePayment };
