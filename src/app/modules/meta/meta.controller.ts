import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { MetaServices } from "./meta.service";

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
  metaCounts,
};
