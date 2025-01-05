import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

const uploadImages = catchAsync(async (req, res) => {
  const result = JSON.parse(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Images uploaded successfully",
    data: result,
  });
});

export const UploadController = {
  uploadImages,
};
