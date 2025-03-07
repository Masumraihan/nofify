import { Prisma, User } from "@prisma/client";
import { uploadToS3 } from "../../constant/s3";
import { USER_ROLE } from "../../enums";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import { userSearchableFields } from "./user.constant";

const getUsers = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const andConditions: Prisma.UserWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterQuery } = query;

  // Add search term condition
  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.UserWhereInput = {
    AND: andConditions.length ? andConditions : undefined,
    isDelete: false,

    NOT: {
      role: USER_ROLE.SUPER_ADMIN,
    },
  };

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      email: user.role === USER_ROLE.SUPER_ADMIN,
      fullName: true,
      firstName: true,
      lastName: true,
      phoneNumber: user.role === USER_ROLE.SUPER_ADMIN,
      role: user.role === USER_ROLE.SUPER_ADMIN,
      profilePicture: true,
      createdAt: true,
      updatedAt: true,
      isActive: true,
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const updateUser = async (id: string, payload: Prisma.UserUpdateInput) => {
  const result = await prisma.user.update({
    where: {
      id,
    },
    data: payload,
  });
  return result;
};

const deleteUser = async (id: string) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    const result = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isDelete: true,
      },
    });
    return result;
  });
  return result;
};

const getUser = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id,
      isDelete: false,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      profilePicture: true,
      createdAt: true,
      updatedAt: true,
      isActive: true,
      phoneNumber: true,
    },
  });
  return result;
};

const getMyProfile = async (user: TTokenUser) => {
  const result = await prisma.user.findUniqueOrThrow({
    where: {
      id: user.id,
      isDelete: false,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      profilePicture: true,
      phoneNumber: true,
      createdAt: true,
      updatedAt: true,
      fcmToken: true,
      isActive: true,
      totalCoins: true,
      code: true,
      referralCode: true,
    },
  });
  return result;
};

const updateMyProfile = async (user: TTokenUser, payload: Prisma.UserUpdateInput) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    const result = await transactionClient.user.update({
      where: {
        id: user.id,
        isDelete: false,
      },
      data: { ...payload },
    });

    return result;
  });

  return result;
};

const deleteMyProfile = async (user: TTokenUser) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    const result = await transactionClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        isDelete: true,
      },
    });

    return result;
  });

  return result;
};

const uploadImage = async (file: Express.Multer.File) => {
  const extension = file.originalname.split(".")[1];
  const fileName = `nofify/${Math.floor(100000 + Math.random() * 900000)}.${extension}`;
  const result = await uploadToS3({ file, fileName: `${fileName}` });
  return {
    url: result,
  };
};



export const UserServices = {
  uploadImage,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  deleteMyProfile,
};
