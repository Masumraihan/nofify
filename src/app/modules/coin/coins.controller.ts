import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import { CustomRequest } from "../../types/common";
import { CoinServices } from "./coins.service";
import sendResponse from "../../shared/sendResponse";
import { coinsFilterableFields } from "./coins.constant";
import pick from "../../shared/pick";
import { PaginationOption } from "../../../constant/common";

const sendCoins = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await CoinServices.sendCoins(user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Coins sent successfully",
    data: result,
  });
});

const getCoins = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const query = pick(req.query, coinsFilterableFields);
  const options = pick(req.query, PaginationOption);

  const { data, meta } = await CoinServices.getCoins(user, query, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Coins fetched successfully",
    meta,
    data,
  });
});

const redeemCoins = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await CoinServices.redeemCoins(user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Coins redeemed successfully",
    data: result,
  });
});

export const CoinController = {
  sendCoins,
  getCoins,
  redeemCoins,
};
