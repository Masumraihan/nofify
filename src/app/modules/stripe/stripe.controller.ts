import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CustomRequest, TTokenUser } from "../../types/common";
import { StripeServices } from "./stripe.service";

const getPaymentLinkForProduct = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await StripeServices.getPaymentLinkForProduct(user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment link created successfully",
    data: result,
  });
});

const webhook = catchAsync(async (req, res) => {
  const webhook = await StripeServices.webhook(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Webhook called successfully",
    data: webhook,
  });
});

export const StripeController = {
  webhook,
  getPaymentLinkForProduct,
};
