import path from "path";
import fs from "fs";
import { AssignTask, Prisma } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { scheduleNotifications, stopNotifications } from "../../shared/scheduleNotification";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import {
  ALARM_STATUS,
  ASSIGN_TASK_STATUS,
  assignTaskFilterableFields,
  taskSearchableFields,
} from "./assignTask.constant";
import { TASK_ASSIGNED_TO } from "./task.constant";
import { sendNotification } from "../../shared/sendNotification";
import moment from "moment";
import { sendMail } from "../../helpers/sendMail";
dayjs.extend(utc);
const createAssignTask = async (
  user: TTokenUser,
  payload: { addTaskId: string; taskId: string; userId: string },
) => {
  if (!payload.addTaskId) {
    if (!payload.taskId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Task Id is required");
    } else if (!payload.userId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "User Id is required");
    }
  }

  let addTask;

  if (payload.addTaskId) {
    const addTaskData = await prisma.addTasks.findUniqueOrThrow({
      where: {
        id: payload.addTaskId,
        task: {
          userId: user.id,
        },
      },
    });

    addTask = addTaskData;
  } else {
    const addTaskData = await prisma.addTasks.create({
      data: {
        userId: payload.userId,
        taskId: payload.taskId,
      },
    });

    addTask = addTaskData;
  }

  const isExist = await prisma.assignTask.findFirst({
    where: {
      taskId: addTask.taskId,
      addTaskId: payload.addTaskId,
    },
  });

  if (isExist) {
    throw new Error("You have already assigned this task");
  }

  const taskData = await prisma.task.findUniqueOrThrow({
    where: {
      id: addTask.taskId,
      userId: user.id,
    },
    include: {
      user: true,
      category: true,
      subCategory: true,
    },
  });

  const result = await prisma.assignTask.create({
    data: {
      taskId: taskData.id,
      addTaskId: payload.addTaskId,
      isAccepted: (taskData.assignedTo === TASK_ASSIGNED_TO.MYSELF) === true,
    },
    include: {
      addTask: {
        include: {
          user: true,
        },
      },
      task: {
        include: {
          user: true,
        },
      },
    },
  });

  const parentMailTemplate = path.join(process.cwd(), "/src/template/assign-task.html");
  const forgetOtpEmail = fs.readFileSync(parentMailTemplate, "utf-8");
  const html = forgetOtpEmail
    .replace(/{{assignedTo}}/g, `${user.firstName} ${user.lastName}`)
    .replace(/{{creatorName}}/g, `${taskData?.user?.firstName} ${taskData?.user?.lastName}`)
    .replace(/{{taskTitle}}/g, `${taskData?.title}`)
    .replace(/{{categoryName}}/g, `${taskData?.category?.name}`)
    .replace(/{{subCategoryName}}/g, `${taskData?.category?.name}`)
    .replace(/{{taskDate}}/g, `${moment(taskData?.date).format("LL")}`)
    .replace(/{{remainderHour}}/g, `${taskData?.remainderHour}`)
    .replace(/{{taskDescription}}/g, `${taskData?.description}`);
  await sendMail({
    to: user.email,
    html,
    subject: "You have been assigned for a task",
  });

  if (result.addTask?.user?.fcmToken) {
    sendNotification([result.addTask?.user?.fcmToken], {
      title: "Task assigned to you",
      body: `You have been assigned a task by ${result.task?.user?.firstName} ${result.task?.user?.lastName}.`,
      userId: result.addTask?.user?.id,
    });
  }

  return result;
};

const createManyAssignTask = async (
  user: TTokenUser,
  payload: { taskId: string; userIds: string[] },
) => {
  //const isExist = await prisma.assignTask.findFirst({
  //  where: {
  //    taskId: payload.taskId,
  //    userId: {
  //      in: payload.userIds,
  //    },
  //  },
  //});
  //if (isExist) {
  //  throw new AppError(
  //    StatusCodes.BAD_REQUEST,
  //    "At least one selected user is already assigned to this task.",
  //  );
  //}
  //await prisma.task.findUniqueOrThrow({
  //  where: {
  //    id: payload.taskId,
  //    userId: user.id,
  //  },
  //});
  //const result = await prisma.assignTask.createMany({
  //  data: payload.userIds.map((userId) => ({ taskId: payload.taskId, userId })),
  //});
  //SEND EACH USER A NOTIFICATION
  //const users = await prisma.user.findMany({ where: { id: { in: payload.userIds } } });
  //users.forEach(async (user) => {
  //  if (user.fcmToken) {
  //    sendNotification([user.fcmToken], {
  //      title: "New Task Assigned",
  //      body: `You have been assigned a new task by ${user.firstName || "Unknown User"}.`,
  //      userId: user.id,
  //    });
  //  }
  //});
  //return result;
};

const myTasks = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const andConditions: Prisma.AssignTaskWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterQuery } = query;
  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          task: {
            OR: [
              ...taskSearchableFields.map((field) => ({
                [field]: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              })),
              {
                user: {
                  firstName: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                } as Prisma.UserWhereInput,
              },
            ],
          },
        },
        {
          addTask: {
            user: {
              OR: ["firstName", "lastName", "email"].map((field) => ({
                [field]: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              })),
            },
          },
        },
      ],
    });
  }

  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => {
        if (assignTaskFilterableFields.includes(key)) {
          if (key === "isAccepted") {
            value = value === "true" ? true : false;
          }
          return {
            [key]: {
              equals: value,
            },
          };
        } else {
          return {
            task: {
              [key]: {
                equals: value,
              },
            },
          };
        }
      }),
    });
  }

  const whereConditions: Prisma.AssignTaskWhereInput =
    andConditions.length > 0
      ? { AND: andConditions, addTask: { userId: user.id } }
      : { addTask: { userId: user.id } };

  const result = await prisma.assignTask.findMany({
    where: { ...whereConditions },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      addTask: {
        select: {
          user: {
            select: {
              profilePicture: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      coins: {
        select: {
          coin: true,
        },
      },
      task: {
        include: {
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
              profilePicture: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.assignTask.count({ where: { ...whereConditions } });

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

const myAssignTasks = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const andConditions: Prisma.AssignTaskWhereInput[] = [];

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { searchTerm, date, ...filterQuery } = query;

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          task: {
            OR: [
              ...taskSearchableFields.map((field) => ({
                [field]: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              })),
              {
                user: {
                  firstName: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                } as Prisma.UserWhereInput,
              },
            ],
          },
        },
        {
          addTask: {
            user: {
              OR: ["firstName", "lastName", "email"].map((field) => ({
                [field]: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              })),
            },
          },
        },
      ],
    });
  }

  if (date) {
    const startDate = new Date(date as string);
    const endDate = new Date(date as string);

    // Set start time to 00:00:00
    startDate.setHours(0, 0, 0, 0);

    // Set end time to 23:59:59
    endDate.setHours(23, 59, 59, 999);

    andConditions.push({
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    });
  }

  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => {
        if (assignTaskFilterableFields.includes(key)) {
          if (key === "userId") {
            return {
              addTask: {
                userId: {
                  equals: value,
                },
              },
            } as Prisma.AssignTaskWhereInput;
          }

          if (key === "isAccepted") {
            value = value === "true" ? true : false;
          }
          return {
            [key]: {
              equals: value,
            },
          };
        } else {
          return {
            task: {
              [key]: {
                equals: value,
              },
            },
          };
        }
      }),
    });
  }

  const whereConditions: Prisma.AssignTaskWhereInput =
    andConditions.length > 0
      ? { AND: andConditions, task: { userId: user.id } }
      : { task: { userId: user.id } };

  const result = await prisma.assignTask.findMany({
    where: { ...whereConditions },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      coins: {
        select: {
          coin: true,
        },
      },
      addTask: {
        select: {
          user: {
            select: {
              profilePicture: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },

      task: {
        include: {
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
              profilePicture: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.assignTask.count({
    where: { ...whereConditions, task: { userId: user.id } },
  });

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

const assignTasksDetails = async (id: string) => {
  const result = await prisma.assignTask.findMany({
    where: {
      id,
    },
    include: {
      coins: {
        select: {
          coin: true,
        },
      },
      addTask: {
        select: {
          user: {
            select: {
              profilePicture: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      task: {
        include: {
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
              profilePicture: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const updateAssignTask = async (user: TTokenUser, id: string, payload: Partial<AssignTask>) => {
  const result = await prisma.assignTask.update({
    where: {
      id,
      addTask: {
        userId: user.id,
      },
    },
    data: payload,
  });
  return result;
};

const updateAssignTaskStatus = async (
  user: TTokenUser,
  id: string,
  payload: Partial<AssignTask>,
) => {
  const assignTask = await prisma.assignTask.findUniqueOrThrow({
    where: {
      id,
      addTask: {
        userId: user.id,
      },
    },
    include: {
      addTask: {
        include: {
          user: true,
        },
      },
      task: {
        include: {
          user: true,
        },
      },
    },
  });

  if (assignTask.status === ASSIGN_TASK_STATUS.CANCELLED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You already cancel this task");
  }

  if (
    !assignTask.isAccepted &&
    payload.status !== ASSIGN_TASK_STATUS.CANCELLED &&
    payload.isAccepted !== true
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User did not accept this task");
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    //AFTER ACCEPT THE ASSIGN TASK, SCHEDULE A NOTIFICATION AND REMAINDER NOTIFICATION IN TASK DATE.
    if (payload.isAccepted === true && assignTask?.addTask?.user?.fcmToken) {
      const date = new Date(assignTask.task.date);
      const time = new Date(assignTask?.task?.time);
      const dateTime = dayjs(`${date}`).utc().toDate();
      const message = `You have a pending task: ${assignTask.task.title}. Have you completed it yet?`;
      const alarmScheduleId = scheduleNotifications(
        dateTime,
        assignTask.task.remainderHour * 60 * 60,
        {
          message,
          userId: user.id,
          fcmToken: assignTask?.addTask?.user?.fcmToken,
        },
      );

      await transactionClient.alarm.create({
        data: {
          assignTaskId: id,
          message,
          //make remainder in second
          interval: assignTask.task.remainderHour,
          dateTime,
          alarmScheduleId,
        },
      });

      // SEND NOTIFICATION TO TASK PROVIDER
      if (assignTask?.task?.user?.fcmToken) {
        await sendNotification([assignTask?.task?.user?.fcmToken], {
          title: "Task Accepted",
          body: `${assignTask.task.title} task is assigned to you by ${assignTask.task?.user?.firstName} ${assignTask.task?.user?.lastName} has been accepted.`,
          userId: assignTask?.task?.user?.id,
        });
      }

      // STOP NOTIFICATION AFTER 1 HOUR
      setTimeout(() => stopNotifications(alarmScheduleId), 3600000);
    }

    const result = await transactionClient.assignTask.update({
      where: {
        id,
        addTask: {
          userId: user.id,
        },
      },
      data: payload,
    });

    return result;
  });

  return result;
};

const deleteAssignTask = async (user: TTokenUser, id: string) => {
  const result = await prisma.assignTask.deleteMany({
    where: {
      id,
      addTask: {
        userId: user.id,
      },
    },
  });
  return result;
};

const stopRemainder = async (id: string) => {
  const result = await prisma.alarm.updateMany({
    where: {
      alarmScheduleId: id,
    },
    data: {
      status: ALARM_STATUS.INACTIVE,
    },
  });

  stopNotifications(id);

  return result;
};

export const AssignTaskServices = {
  createAssignTask,
  createManyAssignTask,
  myTasks,
  myAssignTasks,
  assignTasksDetails,
  updateAssignTask,
  updateAssignTaskStatus,
  deleteAssignTask,
  stopRemainder,
};
