import Twilio from "twilio/lib/rest/Twilio";
import config from "../config";

const client = new Twilio(config.message.twilioAccountSID, config.message.twilioAuthToken);

export const sendMessage = async (phoneNumber: string, message: string) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: config.message.twilioPhoneNumber, // Your Twilio number
      to: phoneNumber,
    });
    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const sendVerificationCode = async (phoneNumber: string) => {
  try {
    const verification = await client.verify.v2
      .services(config.message.twilioServiceSID as string)
      .verifications.create({
        to: phoneNumber,
        channel: "sms", // or "call" for voice verification
      });
    return verification;
  } catch (error) {
    console.error("Error sending verification code:", error);
    throw error;
  }
};

export const verifyCode = async (phoneNumber: string, code: string) => {
  try {
    const verificationCheck = await client.verify.v2
      .services(config.message.twilioServiceSID as string)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });
    return verificationCheck;
  } catch (error) {
    console.error("Error verifying code:", error);
    throw error;
  }
};
