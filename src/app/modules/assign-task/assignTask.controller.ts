import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CustomRequest } from "../../types/common";
import { SubscriptionServices } from "./assignTask.service";

const createSubscription = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await SubscriptionServices.createSubscription(user, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Subscription created successfully",
    data: result,
  });
});

const updateSubscription = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await SubscriptionServices.updateSubscription(user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscription update successfully",
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await SubscriptionServices.cancelSubscription(user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscription cancelled successfully",
    data: result,
  });
});

const getSubscription = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await SubscriptionServices.getSubscription(user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscription fetched successfully",
    data: result,
  });
});

export const SubscriptionController = {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscription,
};
