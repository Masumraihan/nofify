import { StatusCodes } from "http-status-codes";
import config from "../../config";
import AppError from "../../errors/AppError";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { PaymentServices } from "./payment.service";
import { PaginationOption } from "../../../constant/common";
import pick from "../../shared/pick";
import { paymentFilterableFields, paymentSearchableFields } from "./payment.constant";

//const createPayment = catchAsync(async (req, res) => {
//  const result = await PaymentServices.createPaymentIntoDb(req.body);
//  sendResponse(res, {
//    statusCode: httpStatus.CREATED,
//    success: true,
//    message: "Payment created successfully",
//    data: result,
//  });
//});

const recentTransactions = catchAsync(async (req, res) => {
  const options = pick(req.query, PaginationOption);
  const query = pick(req.query, paymentFilterableFields);
  const result = await PaymentServices.recentTransactions(query, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment fetched successfully",
    data: result,
  });
});

//const createPaymentLink = catchAsync(async (req, res) => {
//  const result = await PaymentServices.createPaymentLink(req.body);
//  sendResponse(res, {
//    statusCode: StatusCodes.OK,
//    success: true,
//    message: "Payment Link created successfully",
//    data: result,
//  });
//});

const webhook = catchAsync(async (req, res) => {
  const { transactionId, sessionId, redirectUrl, subscriptionId } = req.query;

  if (!sessionId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "stripe session id not found");
  }

  const { payment_id, sessionId: session_id } = await PaymentServices.verifyPaymentWithWebhook(
    sessionId as string,
    transactionId as string,
  );

  if (payment_id && session_id) {
    if (redirectUrl) {
      res.redirect(`${redirectUrl}?paymentId=${payment_id}`);
    } else {
      res.redirect(`${config.payment.paymentSuccessUrl}?paymentId=${payment_id}`);
    }
  } else {
    throw new AppError(StatusCodes.BAD_REQUEST, "Failed to Verify Payment");
  }
});

const updateSubscriptionVerifyPaymentWithWebhook = catchAsync(async (req, res) => {
  const { transactionId, sessionId } = req.query;

  if (!sessionId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "stripe session id not found");
  }

  const { payment_id, sessionId: session_id } =
    await PaymentServices.updateSubscriptionVerifyPaymentWithWebhook(
      sessionId as string,
      transactionId as string,
    );

  if (payment_id && session_id) {
    res.redirect(`${config.payment.paymentSuccessUrl}?paymentId=${payment_id}`);
  } else {
    throw new AppError(StatusCodes.BAD_REQUEST, "Failed to Verify Payment");
  }
});

const getPayment = catchAsync(async (req, res) => {
  const result = await PaymentServices.getPaymentFromDb(req.params.orderId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment fetched successfully",
    data: result,
  });
});

const singleTransaction = catchAsync(async (req, res) => {
  const result = await PaymentServices.singleTransaction(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment fetched successfully",
    data: result,
  });
});

export const PaymentController = {
  //createPaymentLink,
  webhook,
  getPayment,
  recentTransactions,
  updateSubscriptionVerifyPaymentWithWebhook,
  singleTransaction,
};
