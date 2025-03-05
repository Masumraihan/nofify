import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";

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
