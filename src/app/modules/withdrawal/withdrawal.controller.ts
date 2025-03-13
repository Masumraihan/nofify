import { PaginationOption } from "../../../constant/common";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import { CustomRequest } from "../../types/common";
import { withdrawalFilterableFields } from "./withdrawal.constant";
import { WithdrawalService } from "./withdrawal.service";

const createWithdrawal = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await WithdrawalService.createWithdrawal(user, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Withdrawal created successfully",
    data: result,
  });
});

const getWithdrawal = catchAsync(async (req, res) => {
  const query = pick(req.query, withdrawalFilterableFields);
  const options = pick(req.query, PaginationOption);
  const { meta, data } = await WithdrawalService.getWithdrawal(query, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Withdrawal fetched successfully",
    meta,
    data,
  });
});

const getMyWithdrawal = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const query = pick(req.query, withdrawalFilterableFields);
  const options = pick(req.query, PaginationOption);
  const { meta, data } = await WithdrawalService.getMyWithdrawal(user, query, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Withdrawal fetched successfully",
    meta,
    data,
  });
});

const makePayment = catchAsync(async (req, res) => {
  const result = await WithdrawalService.makePayment(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment made successfully",
    data: result,
  });
});

const updateWithdrawal = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await WithdrawalService.updateWithdrawal(user, req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Withdrawal updated successfully",
    data: result,
  });
});

export const WithdrawalController = {
  createWithdrawal,
  getWithdrawal,
  getMyWithdrawal,
  makePayment,
  updateWithdrawal,
};
