import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { StatusCodes } from "http-status-codes";
import config from "../config";
import AppError from "../errors/AppError";

export const sendOTP = async (phoneNumber: string, otp: number) => {
  const params = {
    Message: `Your OTP is from NOFIFY ${otp}`,
    PhoneNumber: phoneNumber,
  };

  try {
    //const result = await sns.publish(params).promise();

    return null;
  } catch (error) {
    console.log(error);
    throw new AppError(StatusCodes.BAD_REQUEST, "Failed to send OTP");
  }
};

export const sendSNSMessage = async (params: { Message: string; PhoneNumber: string }) => {
  // Create a new PublishCommand with the specified parameters
  const command = new PublishCommand({
    Message: params.Message,
    PhoneNumber: params.PhoneNumber,
    MessageAttributes: {
      "AWS.SNS.SMS.SenderID": {
        DataType: "String",
        StringValue: "String",
      },
    },
  });

  const sns = new SNSClient({
    region: config.aws.region as string,
    credentials: {
      accessKeyId: config.aws.accessKeyId as string,
      secretAccessKey: config.aws.secretAccessKey as string,
    },
  });

  // Send the SMS message using the SNS client and the created command
  const message = await sns.send(command);

  // Return the result of the message sending operation
  return message;
};


