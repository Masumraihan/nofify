import { StatusCodes } from "http-status-codes";
import { PaginationOption } from "../../../constant/common";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import { CustomRequest } from "../../types/common";
import { notificationFilterableFields } from "./notification.constant";
import { NotificationServices } from "./notification.service";

const getNotification = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const query = pick(req.query, notificationFilterableFields);
  const option = pick(req.query, PaginationOption);
  const result = await NotificationServices.getNotificationFromDb(user, query, option);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification fetched successfully",
    data: result,
  });
});

const readNotification = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await NotificationServices.readNotificationFromDb(user, req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification read successfully",
    data: result,
  });
});

const deleteNotification = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await NotificationServices.deleteNotificationFromDb(user, req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification deleted successfully",
    data: result,
  });
});

const deleteAllNotification = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await NotificationServices.deleteAllNotificationFromDb(user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification deleted successfully",
    data: result,
  });
});

const createDummyNotification = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await NotificationServices.createDummyNotification(user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification created successfully",
    data: result,
  });
})

export const NotificationControllers = {
  getNotification,
  readNotification,
  deleteNotification,
  deleteAllNotification,
  createDummyNotification,
};
