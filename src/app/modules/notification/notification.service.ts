import { Prisma } from "@prisma/client";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";

const getNotificationFromDb = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const andConditions: Prisma.NotificationWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { ...filterQuery } = query;

  console.log(filterQuery);

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
    userId: user._id,
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
    },
    data: result,
  };
};

const readNotificationFromDb = async (user: TTokenUser, query: Record<string, unknown> = {}) => {
  query.user = user._id;
  const result = await prisma.notification.updateMany({
    where: {
      ...query,
    },
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
      userId: user._id,
    },
  });
  return result;
};

const deleteAllNotificationFromDb = async (user: TTokenUser) => {
  const result = await prisma.notification.deleteMany({
    where: {
      userId: user._id,
    },
  });
  return result;
};

export const NotificationServices = {
  getNotificationFromDb,
  readNotificationFromDb,
  deleteNotificationFromDb,
  deleteAllNotificationFromDb,
};
