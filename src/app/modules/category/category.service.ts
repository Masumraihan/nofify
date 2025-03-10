import { Prisma } from "@prisma/client";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { TPaginationOptions } from "../../types/pagination";
import { categorySearchableFields } from "./category.constant";

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

export const CategoryService = { getAllCategory, getAllSubCategory };
