import { AssignTask, Prisma } from "@prisma/client";
import { TTokenUser } from "../../types/common";
import prisma from "../../shared/prisma";
import { TPaginationOptions } from "../../types/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";
import { assignTaskFilterableFields, taskSearchableFields } from "./assignTask.constant";

const createAssignTask = async (user: TTokenUser, payload: AssignTask) => {
  return await prisma.assignTask.create({ data: { ...payload } });
};

const getAssignTasks = async (query: Record<string, unknown>, options: TPaginationOptions) => {
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
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.assignTask.findMany({
    where: { ...whereConditions },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      task: {
        include: {
          category: true,
          subCategory: true,
          documents: true,
          user: {
            select: {
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

  const { searchTerm, ...filterQuery } = query;

  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => {
        if (assignTaskFilterableFields.includes(key)) {
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
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.assignTask.findMany({
    where: { ...whereConditions, task: { userId: user.id } },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      task: {
        include: {
          category: true,
          subCategory: true,
          documents: true,
          user: {
            select: {
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

const updateAssignTask = async (user: TTokenUser, id: string, payload: Partial<AssignTask>) => {
  const result = await prisma.assignTask.update({ where: { id, userId: user.id }, data: payload });
  return result;
};

const updateAssignTaskStatus = async (
  user: TTokenUser,
  id: string,
  payload: Partial<AssignTask>,
) => {
  const result = await prisma.assignTask.update({ where: { id, userId: user.id }, data: payload });
  return result;
};

const deleteAssignTask = async (user: TTokenUser, id: string) => {
  const result = await prisma.assignTask.deleteMany({ where: { id, userId: user.id } });
  return result;
};

export const AssignTaskServices = {
  createAssignTask,
  getAssignTasks,
  myAssignTasks,
  updateAssignTask,
  updateAssignTaskStatus,
  deleteAssignTask,
};
