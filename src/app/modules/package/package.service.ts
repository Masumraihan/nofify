import { Prisma } from "@prisma/client";
import prisma from "../../shared/prisma";

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

const getPackages = async () => {
  const result = await prisma.package.findMany();
  return result;
};

export const PackageServices = { createPackage, updatePackage, deletePackage, getPackages };
