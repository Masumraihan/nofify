import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CategoryService } from "./category.service";

const getAllCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.getAllCategory();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",
    data: result,
  });
});

const getAllSubCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.getAllSubCategory();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",
    data: result,
  });
});

export const CategoryControllers = { getAllCategory, getAllSubCategory };
