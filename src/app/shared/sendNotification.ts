import admin from "firebase-admin";
import { StatusCodes } from "http-status-codes";
import AppError from "../errors/AppError";
import file from "../firebase/firebase.json";
import prisma from "../shared/prisma";

admin.initializeApp({
  credential: admin.credential.cert(file as any),
});

type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  userId: string;
};

export const sendNotification = async (
  fcmToken: string[],
  payload: NotificationPayload,
): Promise<any> => {
  try {
    console.log({ fcmToken });
    const response = await admin.messaging().sendEachForMulticast({
      tokens: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      apns: {
        headers: {
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
    });
    console.log(response);

    if (response.successCount) {
      fcmToken?.map(async (token) => {
        try {
          if (token) {
            await prisma.notification.create({
              data: {
                title: payload.title,
                body: payload.body,
                userId: payload.userId,
                fcmToken: token,
              },
            });
          } else {
            console.log("FCM Token not found");
          }
        } catch (error) {
          console.log(error);
        }
      });
    }

    console.log("Response:", response.responses);

    return response;
  } catch (error: any) {
    console.error("Error sending message:", error);
    if (error?.code === "messaging/third-party-auth-error") {
      return null;
    } else {
      console.error("Error sending message:", error);
      throw new AppError(
        StatusCodes.NOT_IMPLEMENTED,
        error.message || "Failed to send notification",
      );
    }
  }
};
