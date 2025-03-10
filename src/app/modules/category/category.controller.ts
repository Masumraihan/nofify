import { PaginationOption } from "../../../constant/common";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import { categoryFilterableFields, subCategorySearchableFields } from "./category.constant";
import { CategoryService } from "./category.service";

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

export const CategoryControllers = { getAllCategory, getAllSubCategory };
