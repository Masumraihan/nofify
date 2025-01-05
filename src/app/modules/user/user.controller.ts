import { StatusCodes } from "http-status-codes";
import { UserServices } from "./user.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import AppError from "../../errors/AppError";
import pick from "../../shared/pick";
import { userFilterableFields } from "./user.constant";
import { PaginationOption } from "../../../constant/common";
import { CustomRequest } from "../../types/common";

const getUsers = catchAsync(async (req, res) => {
  const query = pick(req.query, userFilterableFields);
  const option = pick(req.query, PaginationOption);
  const result = await UserServices.getUsers(query, option);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

const getUser = catchAsync(async (req, res) => {
  const result = await UserServices.getUser(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const result = await UserServices.updateUser(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await UserServices.deleteUser(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const result = await UserServices.getMyProfile((req as CustomRequest).user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile fetched successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const result = await UserServices.updateMyProfile((req as any).user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteMyProfile = catchAsync(async (req, res) => {
  const result = await UserServices.deleteMyProfile((req as any).user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please select a file");
  }

  const result = await UserServices.uploadImage(req.file);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Image uploaded successfully",
    data: result,
  });
});

export const UserControllers = {
  uploadImage,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  deleteMyProfile,
};
