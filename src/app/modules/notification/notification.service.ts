import { Prisma } from "@prisma/client";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { sendNotification } from "../../shared/sendNotification";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";

const getNotificationFromDb = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const andConditions: Prisma.NotificationWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { ...filterQuery } = query;

  // Add filterQuery conditions
  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => {
        if (key === "isRead") {
          return {
            [key]: {
              equals: value === "true" ? true : false,
            },
          };
        } else {
          return {
            [key]: {
              equals: value,
            },
          };
        }
      }),
    });
  }

  const whereConditions: Prisma.NotificationWhereInput = {
    AND: andConditions.length ? andConditions : undefined,
    userId: user.id,
  };

  const result = await prisma.notification.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: true,
    },
  });

  const total = await prisma.notification.count({
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

const readNotificationFromDb = async (user: TTokenUser, query: Record<string, unknown> = {}) => {
  query.user = user.id;
  const result = await prisma.notification.updateMany({
    where: { userId: user.id },
    data: {
      isRead: true,
    },
  });
  return result;
};

const deleteNotificationFromDb = async (user: TTokenUser, id: string) => {
  const result = await prisma.notification.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });
  return result;
};

const deleteAllNotificationFromDb = async (user: TTokenUser) => {
  const result = await prisma.notification.deleteMany({
    where: {
      userId: user.id,
    },
  });
  return result;
};

const createDummyNotification = async (user: TTokenUser) => {
  const admin = await prisma.user.findFirst({ where: { id: user.id } });
  if (admin?.fcmToken) {
    await sendNotification([admin?.fcmToken], {
      title: "Dummy notification for testing",
      body: `Dummy notification for testing`,
      userId: admin.id,
    });
  }
};

export const NotificationServices = {
  getNotificationFromDb,
  readNotificationFromDb,
  deleteNotificationFromDb,
  deleteAllNotificationFromDb,
  createDummyNotification,
};
