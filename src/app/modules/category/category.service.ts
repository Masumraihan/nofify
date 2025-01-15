import prisma from "../../shared/prisma";

const getAllCategory = async () => {
  return await prisma.category.findMany();
};

const getAllSubCategory = async () => {
  return await prisma.subCategory.findMany();
};

export const CategoryService = { getAllCategory, getAllSubCategory };
