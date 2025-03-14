import { Prisma } from "@prisma/client";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helpers/paginationHelper";
import { packageSearchableFields } from "./package.constant";

const createPackage = async (payload: Prisma.PackageCreateInput) => {
  const result = await prisma.package.create({ data: payload });
  return result;
};

const updatePackage = async (id: string, payload: Prisma.PackageCreateInput) => {
  const result = await prisma.package.update({ where: { id }, data: payload });
  return result;
};

const deletePackage = async (id: string) => {
  const result = await prisma.package.delete({ where: { id } });
  return result;
};

const getPackages = async (query: Record<string, unknown>, options: Record<string, unknown>) => {
  const AndConditions: Prisma.PackageWhereInput[] = [];
  const { searchTerm, ...filterData } = query;
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  if (searchTerm) {
    AndConditions.push({
      OR: packageSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.PackageWhereInput =
    AndConditions.length > 0 ? { AND: AndConditions } : {};

  const result = await prisma.package.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.package.count({ where: whereConditions });
  const meta = {
    total,
    page,
    limit,
    totalPage: Math.ceil(total / limit),
  };

  return {
    data: result,
    meta,
  };
};

export const PackageServices = { createPackage, updatePackage, deletePackage, getPackages };
