import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { MetaServices } from "./meta.service";
import pick from "../../shared/pick";

const getUsersChartData = catchAsync(async (req, res) => {
  const query = pick(req.query, ["year"]);
  const result = await MetaServices.getUsersChartData(query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users chart data fetched successfully",
    data: result,
  });
});

const paymentsChartData = catchAsync(async (req, res) => {
  const query = pick(req.query, ["year"]);

  const result = await MetaServices.getPaymentChartData(query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment chart data fetched successfully",
    data: result,
  });
});

const metaCounts = catchAsync(async (req, res) => {
  const result = await MetaServices.metaCounts();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Meta counts fetched successfully",
    data: result,
  });
});

export const MetaController = {
  getUsersChartData,
  paymentsChartData,
  metaCounts,
};
