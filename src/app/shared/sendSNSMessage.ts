import AWS from "aws-sdk";
import AppError from "../errors/AppError";
import { StatusCodes } from "http-status-codes";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const sns = new AWS.SNS();

export const sendOTP = async (phoneNumber: string, otp: number) => {
  const params = {
    Message: `Your OTP is ${otp}`,
    PhoneNumber: `+8801650228207`,
  };

  try {
    const result = await sns.publish(params).promise();

    return result;
  } catch (error) {
    console.log(error);
    throw new AppError(StatusCodes.BAD_REQUEST, "Failed to send OTP");
  }
};
