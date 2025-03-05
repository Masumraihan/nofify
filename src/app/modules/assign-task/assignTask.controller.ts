import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AssignTaskServices } from "./assignTask.service";
import { CustomRequest } from "../../types/common";
import pick from "../../shared/pick";
import { assignTaskFilterableFields, taskFilterableFields } from "./assignTask.constant";
import { PaginationOption } from "../../../constant/common";

const createAssignTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await AssignTaskServices.createAssignTask(user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Assign Task created successfully",
    data: result,
  });
});

const myTasks = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const query = pick(req.query, [...assignTaskFilterableFields, ...taskFilterableFields]);
  const option = pick(req.query, PaginationOption);
  const { data, meta } = await AssignTaskServices.myTasks(user, query, option);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Assign Tasks fetched successfully",
    meta,
    data,
  });
});

const myAssignTasks = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const query = pick(req.query, assignTaskFilterableFields);
  const option = pick(req.query, PaginationOption);
  const { data, meta } = await AssignTaskServices.myAssignTasks(user, query, option);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "My Assign Tasks fetched successfully",
    meta,
    data,
  });
});

const assignTasksDetails = catchAsync(async (req, res) => {
  const result = await AssignTaskServices.assignTasksDetails(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Assign Task details fetched successfully",
    data: result,
  });
});

const createManyAssignTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await AssignTaskServices.createManyAssignTask(user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Assign Task created successfully",
    data: result,
  });
});

const updateAssignTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  console.log(req.body);
  const result = await AssignTaskServices.updateAssignTask(user, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Assign Task updated successfully",
    data: result,
  });
});

const updateAssignTaskStatus = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await AssignTaskServices.updateAssignTaskStatus(user, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Assign Task status updated successfully",
    data: result,
  });
});

const deleteAssignTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await AssignTaskServices.deleteAssignTask(user, req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Assign Task deleted successfully",
    data: result,
  });
});

export const AssignTaskControllers = {
  createAssignTask,
  createManyAssignTask,
  myTasks,
  myAssignTasks,
  assignTasksDetails,
  updateAssignTask,
  updateAssignTaskStatus,
  deleteAssignTask,
};
