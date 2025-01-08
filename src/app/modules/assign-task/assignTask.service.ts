import { createId } from "@paralleldrive/cuid2";
import { StatusCodes } from "http-status-codes";
import config from "../../config";

import { Prisma } from "@prisma/client";
import AppError from "../../errors/AppError";
import prisma from "../../shared/prisma";
import { TTokenUser } from "../../types/common";
import { PAYMENT_STATUS } from "../payment/payment.constant";
import { StripeServices } from "../stripe/stripe.service";

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
    const transactionId = `${new Date().getTime()}_${createId()}`;
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
        cancelUrl: config.payment.paymentCancelUrl as string,
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
        webHookUrl: config.payment.updateSubscriptionWebHookUrl as string,
        cancelUrl: config.payment.paymentCancelUrl as string,
      });
    }
    return {
      paymentLink: stripePaymentResponse?.url as string,
    };
  });

  return result;
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
};
