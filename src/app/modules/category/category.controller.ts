import { PaginationOption } from "../../../constant/common";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import { CustomRequest } from "../../types/common";
import { categoryFilterableFields, subCategoryFilterableFields } from "./category.constant";
import { CategoryService } from "./category.service";

const createCategory = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await CategoryService.createCategory(user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const createSubCategory = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await CategoryService.createSubCategory(user, req.body);
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
  const query = pick(req.query, categoryFilterableFields);
  const data = await CategoryService.getMyCategories(user, query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",

    data,
  });
});

const getMyCreatedCategories = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const query = pick(req.query, categoryFilterableFields);
  const data = await CategoryService.getMyCreatedCategories(user, query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",
    data,
  });
});

const getAllSubCategory = catchAsync(async (req, res) => {
  const query = pick(req.query, subCategoryFilterableFields);
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
  const query = pick(req.query, subCategoryFilterableFields);
  const options = pick(req.query, PaginationOption);
  const data = await CategoryService.getMySubCategories(user, query, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",
    data,
  });
});

const getMyCreatedSubCategories = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const query = pick(req.query, subCategoryFilterableFields);
  const options = pick(req.query, PaginationOption);
  const data = await CategoryService.getMyCreatedSubCategories(user, query, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Sub category fetched successfully",
    data,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await CategoryService.deleteCategory(user, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

const deleteSubCategory = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await CategoryService.deleteSubCategory(user, req.params.id);
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
  getMyCreatedCategories,
  getMyCreatedSubCategories,
};
