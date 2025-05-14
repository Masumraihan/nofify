import { createId } from "@paralleldrive/cuid2";
import { StatusCodes } from "http-status-codes";
import config from "../../config";
import { Prisma } from "@prisma/client";
import AppError from "../../errors/AppError";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { PAYMENT_STATUS } from "../payment/payment.constant";
import { StripeServices } from "../stripe/stripe.service";
import generateCryptoString from "../../shared/generateRandomString";

const createSubscription = async (user: TTokenUser, payload: { packageId: string }) => {
  const packageData = await prisma.package.findFirstOrThrow({
    where: {
      id: payload.packageId,
    },
  });

  //const isSubscriptionExist = await prisma.subscription.findFirst({
  //  where: {
  //    userId: user.id,
  //    isActive: true,
  //  },
  //});

  const result = await prisma.$transaction(async (transactionClient: Prisma.TransactionClient) => {
    const transactionId = generateCryptoString(6);
    const subscription = await transactionClient.subscription.create({
      data: {
        userId: user.id,
        packageId: payload.packageId,
        transactionId,
      },
    });

    const payment = await transactionClient.payment.create({
      data: {
        amount: packageData.price,
        userId: user.id,
        status: PAYMENT_STATUS.UNPAID,
        transactionId,
        subscriptionId: subscription.id,
      },
      include: {
        user: true,
      },
    });

    let stripePaymentResponse = null;
    if (payment) {
      stripePaymentResponse = await StripeServices.createPaymentLink({
        user: payment.user,
        amount: payment.amount,
        name: "Subscription Payment",
        metaData: { subscriptionId: subscription.id, transactionId: transactionId },
        paymentIntentDataMetaData: {
          paymentId: payment.id,
          subscriptionId: subscription.id,
          transactionId,
        },
        query: { subscriptionId: subscription.id, transactionId: transactionId },
        webHookUrl: config.payment.webHookUrl as string,
        cancelUrl: `${config.server_url}/api/v1/subscription/success?success=false`,
      });
    }

    return {
      paymentLink: stripePaymentResponse?.url as string,
    };
  });

  return result;
};

const updateSubscription = async (user: TTokenUser, payload: { packageId: string }) => {
  const packageData = await prisma.package.findFirstOrThrow({
    where: {
      id: payload.packageId,
    },
  });

  const result = await prisma.$transaction(async (transactionClient: Prisma.TransactionClient) => {
    const currentSubscription = await transactionClient.subscription.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (!currentSubscription) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "No active subscription detected. Please subscribe first to enable updates to your subscription.",
      );
    }

    await transactionClient.subscription.update({
      where: {
        userId: user.id,
        isActive: true,
        id: currentSubscription?.id,
      },
      data: {
        isActive: false,
      },
    });

    const transactionId = `${new Date().getTime()}_${createId()}`;
    const subscription = await transactionClient.subscription.create({
      data: {
        userId: user.id,
        packageId: packageData.id,
        transactionId,
      },
    });

    const payment = await transactionClient.payment.create({
      data: {
        amount: packageData.price,
        userId: user.id,
        status: PAYMENT_STATUS.UNPAID,
        transactionId,
        subscriptionId: subscription.id,
      },
      include: {
        user: true,
      },
    });

    let stripePaymentResponse = null;
    if (payment) {
      stripePaymentResponse = await StripeServices.createPaymentLink({
        user: payment.user,
        amount: payment.amount,
        name: "Subscription Payment",
        metaData: { subscriptionId: subscription.id, transactionId: transactionId },
        paymentIntentDataMetaData: {
          paymentId: payment.id,
          subscriptionId: subscription.id,
          transactionId,
        },
        query: { subscriptionId: subscription.id, transactionId: transactionId },
        webHookUrl: config.payment.webHookUrl as string,
        cancelUrl: `${config.server_url}/api/v1/subscription/success?success=false`,
      });
    }
    return {
      paymentLink: stripePaymentResponse?.url as string,
    };
  });

  return result;
};

const cancelSubscription = async (user: TTokenUser) => {
  const result = await prisma.subscription.findFirstOrThrow({
    where: {
      userId: user.id,
      isActive: true,
    },
    include: {
      payment: true,
      package: true,
    },
  });

  const transactionId = result.transactionId;
  const payment = await prisma.payment.findUniqueOrThrow({
    where: {
      transactionId,
    },
  });

  if (payment.paymentData) {
    const intentId = JSON.parse(payment?.paymentData as string).payment_intent as string;

    // calculate refund amount
    //const eachDayRefundAmount = result.package.price / daysLeft;
    //const refundAmount = eachDayRefundAmount * daysLeft;
    //const refundPayment = await StripeServices.refundPayment(intentId, refundAmount);

    const info = await prisma.$transaction(async (transactionClient: Prisma.TransactionClient) => {
      await transactionClient.subscription.update({
        where: {
          userId: user.id,
          isActive: true,
          id: result.id,
        },
        data: {
          isActive: false,
        },
      });

      await transactionClient.payment.update({
        where: {
          transactionId,
        },
        data: {
          status: PAYMENT_STATUS.REFUNDED,
        },
      });
    });

    return info;
  }
};

const getSubscription = async (user: TTokenUser) => {
  const result = await prisma.subscription.findFirstOrThrow({
    where: {
      userId: user.id,
      isActive: true,
    },
  });
  return result;
};

export const SubscriptionServices = {
  createSubscription,
  updateSubscription,
  getSubscription,
  cancelSubscription,
};
