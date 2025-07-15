import { Category, Prisma, SubCategory } from "@prisma/client";
import { USER_ROLE } from "../../enums";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import { categorySearchableFields } from "./category.constant";

const createCategory = async (user: TTokenUser, data: Category) => {
  const result = await prisma.category.create({ data: { ...data, userId: user.id } });
  return result;
};

const createSubCategory = async (user: TTokenUser, data: SubCategory) => {
  const result = await prisma.subCategory.create({ data: { ...data, userId: user.id } });
  return result;
};

const updateCategory = async (id: string, data: Prisma.CategoryUpdateInput) => {
  const result = await prisma.category.update({ where: { id }, data });
  return result;
};

const updateSubCategory = async (id: string, data: Prisma.SubCategoryUpdateInput) => {
  const result = await prisma.subCategory.update({ where: { id }, data });
  return result;
};

const getAllCategory = async (query: Record<string, unknown>, options: TPaginationOptions) => {
  const AndConditions: Prisma.CategoryWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = query;

  if (searchTerm) {
    AndConditions.push({
      OR: categorySearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditions = AndConditions.length > 0 ? { AND: AndConditions } : {};

  const data = await prisma.category.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      subCategories: true,
    },
  });

  const total = await prisma.category.count({ where: whereConditions });

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

const getMyCategories = async (user: TTokenUser, query: Record<string, unknown>) => {
  const andConditions: Prisma.CategoryWhereInput[] = [];

  const { searchTerm, ...filterQuery } = query;

  if (searchTerm) {
    andConditions.push({
      OR: categorySearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }
  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => ({
        [key]: {
          equals: value,
        },
      })),
    });
  }

  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};

  const admin = await prisma.user.findFirst({ where: { role: USER_ROLE.SUPER_ADMIN } });
  return await prisma.category.findMany({
    where: { ...whereConditions, OR: [{ userId: user.id }, { userId: admin?.id }] },
    include: { subCategories: true },
  });
};

const getMyCreatedCategories = async (user: TTokenUser, query: Record<string, unknown>) => {
  const andConditions: Prisma.CategoryWhereInput[] = [];

  const { searchTerm, ...filterQuery } = query;

  if (searchTerm) {
    andConditions.push({
      OR: categorySearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }
  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => ({
        [key]: {
          equals: value,
        },
      })),
    });
  }

  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};

  return await prisma.category.findMany({
    where: { ...whereConditions, OR: [{ userId: user.id }] },
    include: { subCategories: true },
  });
};

const getAllSubCategory = async (query: Record<string, unknown>, options: TPaginationOptions) => {
  const AndConditions: Prisma.SubCategoryWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = query;

  if (searchTerm) {
    AndConditions.push({
      OR: categorySearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    AndConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: {
          equals: value,
        },
      })),
    });
  }

  const whereConditions = AndConditions.length > 0 ? { AND: AndConditions } : {};

  const data = await prisma.subCategory.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      category: true,
    },
  });

  const total = await prisma.subCategory.count({ where: whereConditions });

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

const getMySubCategories = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const admin = await prisma.user.findFirst({ where: { role: USER_ROLE.SUPER_ADMIN } });
  const AndConditions: Prisma.SubCategoryWhereInput[] = [];

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = query;

  if (searchTerm) {
    AndConditions.push({
      OR: categorySearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    AndConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: {
          equals: value,
        },
      })),
    });
  }

  const whereConditions = AndConditions.length > 0 ? { AND: AndConditions } : {};

  return await prisma.subCategory.findMany({
    where: { ...whereConditions, OR: [{ userId: user.id }, { userId: admin?.id }] },
    include: { category: true },
  });
};
const getMyCreatedSubCategories = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const AndConditions: Prisma.SubCategoryWhereInput[] = [];

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = query;

  if (searchTerm) {
    AndConditions.push({
      OR: categorySearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    AndConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: {
          equals: value,
        },
      })),
    });
  }

  const whereConditions = AndConditions.length > 0 ? { AND: AndConditions } : {};

  return await prisma.subCategory.findMany({
    where: { ...whereConditions, OR: [{ userId: user.id }] },
    include: { category: true },
  });
};

const deleteCategory = async (user: TTokenUser, id: string) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    // delete tasks

    await transactionClient.category.update({
      where: { id },
      data: {
        tasks: {
          deleteMany: {},
        },
      },
    });

    await transactionClient.subCategory.deleteMany({
      where: { categoryId: id },
    });
    const result = await transactionClient.category.delete({ where: { id, userId: user.id } });
    return result;
  });
  return result;
};

const deleteSubCategory = async (user: TTokenUser, id: string) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    await transactionClient.subCategory.update({
      where: { id },
      data: {
        tasks: {
          deleteMany: {},
        },
      },
    });
    const result = await transactionClient.subCategory.delete({ where: { id, userId: user.id } });
    return result;
  });
  return result;
};

export const CategoryService = {
  createCategory,
  createSubCategory,
  updateCategory,
  updateSubCategory,
  getAllCategory,
  getAllSubCategory,
  getMyCreatedCategories,
  getMyCreatedSubCategories,
  deleteCategory,
  deleteSubCategory,
  getMyCategories,
  getMySubCategories,
};
