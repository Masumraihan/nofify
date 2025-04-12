import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { SettingsServices } from "./settings.service";
import AppError from "../../errors/AppError";

const createSettings = catchAsync(async (req, res) => {
  const result = await SettingsServices.createSettings(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Settings created successfully",
    data: result,
  });
});

const getSettings = catchAsync(async (req, res) => {
  if (!req.params.label) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please provide label as param");
  }
  const result = await SettingsServices.getSettings(req.params.label);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Settings fetched successfully",
    data: result,
  });
});

const updateSettings = catchAsync(async (req, res) => {
  const result = await SettingsServices.updateSettings(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Settings updated successfully",
    data: result,
  });
});

const createTaskRemainderMinutes = catchAsync(async (req, res) => {
  const result = await SettingsServices.createTaskRemainderMinutes(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task Remainder Minutes created successfully",
    data: result,
  });
});

const getTaskRemainderMinutes = catchAsync(async (req, res) => {
  const result = await SettingsServices.getTaskRemainderMinutes();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task Remainder Minutes fetched successfully",
    data: result,
  });
});

const deleteTaskRemainderMinutes = catchAsync(async (req, res) => {
  const result = await SettingsServices.deleteTaskRemainderMinutes(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task Remainder Minutes delete successfully",
    data: result,
  });
});

export const SettingsControllers = {
  createSettings,
  getSettings,
  updateSettings,
  getTaskRemainderMinutes,
  createTaskRemainderMinutes,
  deleteTaskRemainderMinutes,
};
