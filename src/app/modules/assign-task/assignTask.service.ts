import { AssignTask, Prisma } from "@prisma/client";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import {
  ASSIGN_TASK_STATUS,
  assignTaskFilterableFields,
  taskSearchableFields,
} from "./assignTask.constant";
import { TASK_ASSIGNED_TO } from "./task.constant";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { sendNotification } from "../../shared/sendNotification";

const createAssignTask = async (user: TTokenUser, payload: AssignTask) => {
  const isExist = await prisma.assignTask.findFirst({
    where: {
      taskId: payload.taskId,
      userId: payload.userId,
    },
  });

  if (isExist) {
    throw new Error("You have already assigned this task");
  }

  const task = await prisma.task.findUniqueOrThrow({
    where: {
      id: payload.taskId,
      userId: user.id,
    },
  });

  return await prisma.assignTask.create({
    data: { ...payload, isAccepted: (task.assignedTo === TASK_ASSIGNED_TO.MYSELF) === true },
  });
};

const createManyAssignTask = async (
  user: TTokenUser,
  payload: { taskId: string; userIds: string[] },
) => {
  const isExist = await prisma.assignTask.findFirst({
    where: {
      taskId: payload.taskId,
      userId: {
        in: payload.userIds,
      },
    },
  });

  if (isExist) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "At least one selected user is already assigned to this task.",
    );
  }

  await prisma.task.findUniqueOrThrow({
    where: {
      id: payload.taskId,
      userId: user.id,
    },
  });

  const result = await prisma.assignTask.createMany({
    data: payload.userIds.map((userId) => ({ taskId: payload.taskId, userId })),
  });

  //SEND EACH USER A NOTIFICATION

  const users = await prisma.user.findMany({ where: { id: { in: payload.userIds } } });

  users.forEach(async (user) => {
    if (user.fcmToken) {
      sendNotification([user.fcmToken], {
        title: "New Task Assigned",
        body: `You have been assigned a new task by ${user.firstName || "Unknown User"}.`,
        userId: user.id,
      });
    }
  });

  return result;
};

const myTasks = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const andConditions: Prisma.AssignTaskWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterQuery } = query;

  if (searchTerm) {
    andConditions.push({
      task: {
        OR: taskSearchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      },
    });
  }

  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => {
        if (assignTaskFilterableFields.includes(key)) {
          if (key === "isAccepted") {
            value = value === "true" ? true : false;
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

  const whereConditions: Prisma.AssignTaskWhereInput =
    andConditions.length > 0 ? { AND: andConditions, userId: user.id } : { userId: user.id };

  const result = await prisma.assignTask.findMany({
    where: { ...whereConditions },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: {
        select: {
          profilePicture: true,
          firstName: true,
          lastName: true,
        },
      },
      coins: {
        select: {
          coin: true,
        },
      },
      task: {
        include: {
          category: true,
          subCategory: true,
          documents: {
            select: {
              id: true,
              url: true,
              key: true,
            },
          },
          user: {
            select: {
              profilePicture: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.assignTask.count({ where: { ...whereConditions } });

  const meta = {
    total,
    page,
    limit,
    totalPage: Math.ceil(total / limit),
  };

  return {
    meta,
    data: result,
  };
};

const myAssignTasks = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const andConditions: Prisma.AssignTaskWhereInput[] = [];

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { searchTerm, date, ...filterQuery } = query;

  if (searchTerm) {
    andConditions.push({
      task: {
        OR: taskSearchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      },
    });
  }

  if (date) {
    const startDate = new Date(date as string);
    const endDate = new Date(date as string);

    // Set start time to 00:00:00
    startDate.setHours(0, 0, 0, 0);

    // Set end time to 23:59:59
    endDate.setHours(23, 59, 59, 999);

    andConditions.push({
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    });
  }

  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => {
        if (assignTaskFilterableFields.includes(key)) {
          if (key === "isAccepted") {
            value = value === "true" ? true : false;
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

  const whereConditions: Prisma.AssignTaskWhereInput =
    andConditions.length > 0
      ? { AND: andConditions, task: { userId: user.id } }
      : { task: { userId: user.id } };

  const result = await prisma.assignTask.findMany({
    where: { ...whereConditions },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: {
        select: {
          profilePicture: true,
          firstName: true,
          lastName: true,
        },
      },
      coins: {
        select: {
          coin: true,
        },
      },
      task: {
        include: {
          category: true,
          subCategory: true,
          documents: {
            select: {
              id: true,
              url: true,
              key: true,
            },
          },
          user: {
            select: {
              profilePicture: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.assignTask.count({
    where: { ...whereConditions, task: { userId: user.id } },
  });

  const meta = {
    total,
    page,
    limit,
    totalPage: Math.ceil(total / limit),
  };

  return {
    meta,
    data: result,
  };
};

const assignTasksDetails = async (id: string) => {
  const result = await prisma.assignTask.findMany({
    where: {
      id,
    },
    include: {
      coins: {
        select: {
          coin: true,
        },
      },
      user: {
        select: {
          profilePicture: true,
          firstName: true,
          lastName: true,
        },
      },
      task: {
        include: {
          category: true,
          subCategory: true,
          documents: {
            select: {
              id: true,
              url: true,
              key: true,
            },
          },
          user: {
            select: {
              profilePicture: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const updateAssignTask = async (user: TTokenUser, id: string, payload: Partial<AssignTask>) => {
  const result = await prisma.assignTask.update({ where: { id, userId: user.id }, data: payload });
  return result;
};

const updateAssignTaskStatus = async (
  user: TTokenUser,
  id: string,
  payload: Partial<AssignTask>,
) => {
  const assignTask = await prisma.assignTask.findUniqueOrThrow({ where: { id, userId: user.id } });

  if (assignTask.status === ASSIGN_TASK_STATUS.CANCELLED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You already cancel this task");
  }

  if (
    !assignTask.isAccepted &&
    payload.status !== ASSIGN_TASK_STATUS.CANCELLED &&
    payload.isAccepted !== true
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User did not accept this task");
  }

  const result = await prisma.assignTask.update({ where: { id, userId: user.id }, data: payload });
  return result;
};

const deleteAssignTask = async (user: TTokenUser, id: string) => {
  const result = await prisma.assignTask.deleteMany({ where: { id, userId: user.id } });
  return result;
};

export const AssignTaskServices = {
  createAssignTask,
  createManyAssignTask,
  myTasks,
  myAssignTasks,
  assignTasksDetails,
  updateAssignTask,
  updateAssignTaskStatus,
  deleteAssignTask,
};
