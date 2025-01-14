import { File, Prisma, Task } from "@prisma/client";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";

const createTask = async (
  user: TTokenUser,
  payload: Task & { subCategory?: string; category: string; documents: File[] },
) => {
  if (!payload.subCategoryId && !payload.subCategory) {
    throw new Error("subCategory or subCategoryId is required");
  }

  if (!payload.category && !payload.subCategoryId) {
    throw new Error("category or subCategoryId is required");
  }

  const { subCategory: subC, category: c, documents, ...data } = payload;

  let category;
  let subCategory;

  if (payload.categoryId) {
    category = await prisma.category.upsert({
      where: {
        id: payload.categoryId,
      },
      update: {},
      create: {
        name: payload.category,
      },
    });
  }

  if (payload.subCategory && category) {
    subCategory = await prisma.subCategory.upsert({
      where: {
        name: payload.subCategory,
      },
      update: {},
      create: {
        name: payload.subCategory,
        categoryId: category.id,
      },
    });
  }

  return await prisma.task.create({
    data: { ...data, subCategoryId: subCategory?.id, userId: user.id },
  });
};

const getTasks = async (query: Record<string, unknown>, options: TPaginationOptions) => {
  const andConditions: Prisma.TaskWhereInput[] = [];

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterQuery } = query;

  // Add search term condition
  if (searchTerm) {
    andConditions.push({
      OR: taskSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Add filterQuery conditions
  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => ({
        [key]: {
          equals: value,
        },
      })),
    });
  }

  const whereConditions: Prisma.TaskWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.task.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      category: true,
      documents: true,
      subCategory: true,
    },
  });

  const total = await prisma.task.count({ where: whereConditions });

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

const updateTask = async (user: TTokenUser, id: string, payload: Partial<Task>) => {
  if (payload.subCategoryId) {
    //  IF SUBCATEGORY ID IS PROVIDED AND NOT EXIST THROW ERROR
    await prisma.subCategory.findUniqueOrThrow({
      where: {
        id: payload.subCategoryId,
      },
    });
  }

  if (payload.categoryId) {
    //  IF CATEGORY ID IS PROVIDED AND NOT EXIST THROW ERROR
    await prisma.category.findUniqueOrThrow({
      where: {
        id: payload.categoryId,
      },
    });
  }

  return await prisma.task.update({ where: { id, userId: user.id }, data: payload });
};

const deleteTask = async (user: TTokenUser, id: string) => {
  return await prisma.task.deleteMany({ where: { id, userId: user.id } });
};

export const TaskServices = {
  createTask,
  updateTask,
  deleteTask,
};
