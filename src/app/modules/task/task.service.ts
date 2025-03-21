import { File, Prisma, Task } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { deleteManyFromS3 } from "../../constant/s3";
import AppError from "../../errors/AppError";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import { TASK_ASSIGNED_TO } from "../assign-task/task.constant";
import { taskSearchableFields } from "./task.constant";

const createTask = async (
  user: TTokenUser,
  payload: Task & { subCategory?: string; category: string; documents: File[]; userIds?: string[] },
) => {
  if (!payload.subCategoryId && !payload.subCategory) {
    throw new Error("subCategory or subCategoryId is required");
  }

  if (!payload.category && !payload.subCategoryId) {
    throw new Error("category or subCategoryId is required");
  }

  if (payload.assignedTo === TASK_ASSIGNED_TO.MULTIPLE) {
    const userData = await prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
    });

    if (!userData.totalCoins) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "You don't have enough coins to assign task to multiple users",
      );
    }
  }

  const { subCategory: subC, category: c, documents, userIds, ...data } = payload;

  let category;
  let subCategory;

  if (payload.category) {
    category = await prisma.category.upsert({
      where: {
        name: payload.category,
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

  if (!category?.id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Category is required");
  }

  if (!subCategory?.id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "SubCategory is required");
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    const taskData = await transactionClient.task.create({
      data: { ...data, categoryId: category?.id, subCategoryId: subCategory?.id, userId: user.id },
    });
    if (documents?.length) {
      await transactionClient.file.createMany({
        data: documents.map((file) => ({
          taskId: taskData.id,
          key: file.key,
          url: file.url,
          userId: user.id,
        })),
      });
    }
    if (userIds?.length) {
      await Promise.all(
        userIds.map(async (id: string) => {
          await transactionClient.addTasks.create({
            data: {
              taskId: taskData.id,
              userId: id,
            },
          });

          //const assignUser = await transactionClient.user.findFirst({
          //  where: {
          //    id,
          //  },
          //});

          //if (assignUser?.fcmToken) {
          //  sendNotification([assignUser?.fcmToken], {
          //    title: "New Task Assigned",
          //    body: `You have been assigned a new task by ${user.firstName || "Unknown User"}.`,
          //    userId: assignUser.id,
          //  });
          //}
        }),
      );
    } else if (payload.assignedTo === TASK_ASSIGNED_TO.MYSELF) {
      const addTask = await transactionClient.addTasks.create({
        data: {
          taskId: taskData.id,
          userId: user.id,
        },
      });

      await transactionClient.assignTask.create({
        data: {
          taskId: taskData.id,
          addTaskId: addTask.id,
          isAccepted: true,
        },
      });
    }

    return taskData;
  });
  return result;
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
    where: { ...whereConditions },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      category: true,
      documents: {
        select: {
          id: true,
          url: true,
          key: true,
        },
      },
      subCategory: true,
      addTasks: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
        },
      },
      _count: {
        select: {
          addTasks: true,
        },
      },
      assignTask: {
        include: {
          addTask: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      },
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

const getMyTasks = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  return await getTasks({ ...query, userId: user.id }, options);
};

const getTaskById = async (id: string) => {
  return await prisma.task.findUniqueOrThrow({
    where: { id },
    include: {
      addTasks: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
        },
      },
      category: true,
      subCategory: true,
      documents: {
        select: {
          id: true,
          url: true,
          key: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
          phoneNumber: true,
          email: true,
        },
      },
      _count: {
        select: {
          addTasks: true,
        },
      },

      assignTask: {
        include: {
          addTask: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

const updateTask = async (
  user: TTokenUser,
  id: string,
  payload: Partial<Task> & { documents?: File[]; deletedDocumentIds?: string[] },
) => {
  const { documents, deletedDocumentIds, ...data } = payload;

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

  return await prisma.$transaction(async (transactionClient) => {
    const result = await prisma.task.update({ where: { id, userId: user.id }, data });

    if (documents?.length) {
      const documentsData = await transactionClient.file.createMany({
        data: documents.map((doc) => ({
          ...doc,
          userId: user.id,
          taskId: result.id,
        })),
      });
    }

    if (deletedDocumentIds?.length) {
      const deletedDocuments = await transactionClient.file.findMany({
        where: {
          id: {
            in: deletedDocumentIds,
          },
        },
      });

      const deleteDocumentKeys = deletedDocuments.map((doc) => `nofify/document/${doc.key}`);
      const res = await deleteManyFromS3(deleteDocumentKeys);
      if (res.$metadata.httpStatusCode === 200) {
        await transactionClient.file.deleteMany({
          where: {
            id: {
              in: deletedDocumentIds,
            },
          },
        });
      }
    }
    return result;
  });
};

const deleteTask = async (user: TTokenUser, id: string) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    const deleteAllAddTasks = await transactionClient.addTasks.deleteMany({
      where: {
        taskId: id,
      },
    });

    const deleteAllAssignTasks = await transactionClient.assignTask.deleteMany({
      where: {
        taskId: id,
      },
    });

    const result = await transactionClient.task.delete({ where: { id, userId: user.id } });

    const documents = await transactionClient.file.findMany({
      where: {
        taskId: id,
      },
    });

    const deleteDocumentKeys = documents.map((doc) => `nofify/document/${doc.key}`);
    if (deleteDocumentKeys.length > 0) {
      const res = await deleteManyFromS3(deleteDocumentKeys);
      if (res.$metadata.httpStatusCode === 200) {
        await transactionClient.file.deleteMany({
          where: {
            taskId: id,
          },
        });
      }
    }

    return result;
  });
};

export const TaskServices = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getMyTasks,
  getTaskById,
};
