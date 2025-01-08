import { Task } from "@prisma/client";
import { TTokenUser } from "../../types/common";
import prisma from "../../shared/prisma";

const createTask = async (
  user: TTokenUser,
  payload: Task & { subCategory?: string; category: string },
) => {
  if (!payload.subCategoryId && !payload.subCategory) {
    throw new Error("subCategory or subCategoryId is required");
  }

  if (!payload.category && !payload.subCategoryId) {
    throw new Error("category or subCategoryId is required");
  }

  const { subCategory: subC, category: c, ...data } = payload;

  let category;
  let subCategory;

  if (payload.subCategoryId) {
    category = await prisma.category.upsert({
      where: {
        id: payload.subCategoryId,
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

  const result = await prisma.task.create({
    data: { ...data, subCategoryId: subCategory?.id, userId: user.id },
  });
  return result;
};

export const TaskServices = {
  createTask,
};
