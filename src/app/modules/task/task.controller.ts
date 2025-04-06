import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { TaskServices } from "./task.service";
import { CustomRequest } from "../../types/common";
import pick from "../../shared/pick";
import { PaginationOption } from "../../../constant/common";
import { taskFilterableFields } from "./task.constant";
import AppError from "../../errors/AppError";

const createTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await TaskServices.createTask(user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Task created successfully",
    data: result,
  });
});

const getTasks = catchAsync(async (req, res) => {
  const query = pick(req.query, taskFilterableFields);
  const options = pick(req.query, PaginationOption);
  const { meta, data } = await TaskServices.getTasks(query, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tasks fetched successfully",
    meta,
    data,
  });
});

const getMyTasks = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const query = pick(req.query, taskFilterableFields);
  const options = pick(req.query, PaginationOption);
  const { data, meta } = await TaskServices.getMyTasks(user, query, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tasks fetched successfully",
    meta,
    data,
  });
});

const getTaskById = catchAsync(async (req, res) => {
  const result = await TaskServices.getTaskById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task fetched successfully",
    data: result,
  });
});

const updateTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await TaskServices.updateTask(user, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task update successfully",
    data: result,
  });
});

const deleteTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await TaskServices.deleteTask(user, req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task deleted successfully",
    data: result,
  });
});

const addTaskIntoCalendar = catchAsync(async (req, res) => {
  const googleToken = req.headers?.token as string | undefined;
  if (!googleToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please provide google token");
  }
  const result = await TaskServices.addTaskIntoCalendar({
    id: req.params.id,
    googleToken,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task added into calendar successfully",
    data: result,
  });
});

export const TaskController = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getMyTasks,
  getTaskById,
  addTaskIntoCalendar,
};
