import { PaginationOption } from "../../../constant/common";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import { CustomRequest } from "../../types/common";
import { categoryFilterableFields, subCategorySearchableFields } from "./category.constant";
import { CategoryService } from "./category.service";

const createCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.createCategory(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const createSubCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.createSubCategory(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "SubCategory created successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.updateCategory(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const updateSubCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.updateSubCategory(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "SubCategory updated successfully",
    data: result,
  });
});

const getAllCategory = catchAsync(async (req, res) => {
  const query = pick(req.query, categoryFilterableFields);
  const options = pick(req.query, PaginationOption);
  const { meta, data } = await CategoryService.getAllCategory(query, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",
    meta,
    data,
  });
});

const getMyCategories = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const data = await CategoryService.getMyCategories(user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",

    data,
  });
});

const getAllSubCategory = catchAsync(async (req, res) => {
  const query = pick(req.query, subCategorySearchableFields);
  const options = pick(req.query, PaginationOption);
  const { data, meta } = await CategoryService.getAllSubCategory(query, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",
    meta,
    data,
  });
});

const getMySubCategories = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const data = await CategoryService.getMySubCategories(user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",

    data,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.deleteCategory(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

const deleteSubCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.deleteSubCategory(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "SubCategory deleted successfully",
    data: result,
  });
});

export const CategoryControllers = {
  createCategory,
  createSubCategory,
  updateCategory,
  updateSubCategory,
  getAllCategory,
  getAllSubCategory,
  deleteCategory,
  deleteSubCategory,
  getMyCategories,
  getMySubCategories,
};
