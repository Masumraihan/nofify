import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { PackageServices } from "./package.service";

const createPackage = catchAsync(async (req, res) => {
  const result = await PackageServices.createPackage(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Package created successfully",
    data: result,
  });
});

const updatePackage = catchAsync(async (req, res) => {
  const result = await PackageServices.updatePackage(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Package updated successfully",
    data: result,
  });
});

const getPackages = catchAsync(async (req, res) => {
  const result = await PackageServices.getPackages();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Packages fetched successfully",
    data: result,
  });
});

const deletePackage = catchAsync(async (req, res) => {
  const result = await PackageServices.deletePackage(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Package deleted successfully",
    data: result,
  });
});

const getPackage = catchAsync(async (req, res) => {
  const result = await PackageServices.getPackages();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Package fetched successfully",
    data: result,
  });
});

export const PackageController = {
  createPackage,
  updatePackage,
  getPackages,
  deletePackage,
  getPackage,
};
