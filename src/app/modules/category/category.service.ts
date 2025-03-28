import { Prisma } from "@prisma/client";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { TPaginationOptions } from "../../types/pagination";
import { categorySearchableFields } from "./category.constant";

const createCategory = async (data: Prisma.CategoryCreateInput) => {
  const result = await prisma.category.create({ data });
  return result;
};

const createSubCategory = async (data: Prisma.SubCategoryCreateInput) => {
  const result = await prisma.subCategory.create({ data });
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

const getAllSubCategory = async (query: Record<string, unknown>, options: TPaginationOptions) => {
  const AndConditions: Prisma.SubCategoryWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = query;

  console.log({ filterData });

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

const deleteCategory = async (id: string) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    const result = await transactionClient.category.delete({ where: { id } });
    await transactionClient.subCategory.deleteMany({ where: { categoryId: id } });
    return result;
  });
  return result;
};

const deleteSubCategory = async (id: string) => {
  const result = await prisma.subCategory.delete({ where: { id } });
  return result;
};

export const CategoryService = {
  createCategory,
  createSubCategory,
  updateCategory,
  updateSubCategory,
  getAllCategory,
  getAllSubCategory,
  deleteCategory,
  deleteSubCategory,
};
