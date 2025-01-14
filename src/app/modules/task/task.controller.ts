import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { TaskServices } from "./task.service";
import { CustomRequest } from "../../types/common";

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

export const TaskController = {
  createTask,
  updateTask,
  deleteTask,
};
