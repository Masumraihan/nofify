import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CustomRequest } from "../../types/common";
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
  const result = await WithdrawalService.getWithdrawal();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Withdrawal fetched successfully",
    data: result,
  });
});

const getMyWithdrawal = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await WithdrawalService.getMyWithdrawal(user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Withdrawal fetched successfully",
    data: result,
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

export const WithdrawalController = {
  createWithdrawal,
  getWithdrawal,
  getMyWithdrawal,
  makePayment,
};
