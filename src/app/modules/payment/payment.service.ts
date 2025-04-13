import { createId } from "@paralleldrive/cuid2";
import { StatusCodes } from "http-status-codes";
import config from "../../config";
import AppError from "../../errors/AppError";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../shared/prisma";
import { TPaginationOptions } from "../../types/pagination";
import { StripeServices } from "../stripe/stripe.service";
import { PAYMENT_STATUS, paymentSearchableFields } from "./payment.constant";
import { Prisma } from "@prisma/client";

const verifyPaymentWithWebhook = async (sessionId: string, transactionId: string) => {
  const stripePaymentData = await StripeServices.verifyPayment(sessionId);

  // TODO:NEED ONE MORE URL THATS FOR ONCE VERIFICATION IS FAILED, THE REDIRECT TO THIS URL

  const paymentData = await prisma.payment.findUniqueOrThrow({
    where: { transactionId },
    include: {
      user: true,
      subscription: {
        include: {
          package: true,
        },
      },
    },
  });

  if (!paymentData) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment data not found");
  }

  const subscriptionData = paymentData.subscription;

  if (!subscriptionData) {
    await StripeServices.refundPayment(stripePaymentData.payment_intent as string);
    throw new AppError(StatusCodes.NOT_FOUND, "Subscription Data Not Found");
  }

  if (!stripePaymentData) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment Data Not Found");
  }

  if (stripePaymentData.status !== "complete") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Payment is not succeeded");
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    const paymentData = await transactionClient.payment.update({
      where: {
        transactionId: transactionId,
      },
      data: {
        status: PAYMENT_STATUS.PAID,
        paymentData: JSON.stringify(stripePaymentData),
        stripeTransactionId: stripePaymentData.id,
      },
      include: {
        user: true,
      },
    });

    const userData = paymentData.user;

    // ACTIVE SUBSCRIPTION AND SET RENEWAL DATE

    await transactionClient.subscription.update({
      where: {
        id: subscriptionData.id,
      },
      data: {
        isActive: true,
      },
    });

    await transactionClient.user.update({
      where: {
        id: userData.id,
      },
      data: {
        totalCoins: {
          increment: subscriptionData.package.coin,
        },
      },
    });

    if (userData.referralCode) {
      const referUser = await transactionClient.user.findFirst({
        where: {
          code: userData?.referralCode,
        },
      });

      // ADD 200 COIN TO BOTH USER
      if (referUser) {
        await transactionClient.user.update({
          where: {
            id: referUser.id,
          },
          data: {
            totalCoins: {
              increment: 200,
            },
          },
        });

        await transactionClient.user.update({
          where: {
            id: userData.id,
          },
          data: {
            totalCoins: {
              increment: 200,
            },
          },
        });
      }
    }

    return paymentData;
  });

  return {
    payment_id: result.id,
    sessionId,
  };
};

const updateSubscriptionVerifyPaymentWithWebhook = async (
  sessionId: string,
  transactionId: string,
) => {
  const stripePaymentData = await StripeServices.verifyPayment(sessionId);

  const paymentData = await prisma.payment.findUniqueOrThrow({
    where: { transactionId: transactionId },
    include: {
      user: true,
    },
  });

  if (!paymentData) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment Data Not Found");
  }

  if (!stripePaymentData) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment Data Not Found");
  }

  if (stripePaymentData.status !== "complete") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Payment is not succeeded");
  }

  if (stripePaymentData.id !== sessionId) {
    throw new AppError(StatusCodes.NOT_FOUND, "Failed to Verify Payment");
  }

  if (!stripePaymentData?.payment_intent) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Failed to Verify Payment");
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    const paymentData = await transactionClient.payment.update({
      where: {
        transactionId: transactionId,
      },
      data: {
        status: PAYMENT_STATUS.PAID,
        paymentData: JSON.stringify(stripePaymentData),
      },
      include: {
        user: true,
        subscription: {
          include: {
            package: true,
          },
        },
      },
    });

    if (!paymentData) {
      throw new AppError(StatusCodes.NOT_FOUND, "Payment Data Not Found");
    }

    if (!paymentData.subscription) {
      throw new AppError(StatusCodes.NOT_FOUND, "Subscription Data Not Found");
    }

    const subscriptionData = paymentData.subscription;
    // ACTIVE SUBSCRIPTION AND SET RENEWAL DATE
    await transactionClient.subscription.update({
      where: {
        id: paymentData.subscription.id,
      },
      data: {
        isActive: true,
      },
    });

    return paymentData;
  });

  return {
    payment_id: paymentData.id,
    sessionId,
  };
};

const getPaymentFromDb = async (userId: string) => {
  const paymentData = await prisma.payment.findFirst({
    where: {
      userId,
    },
  });

  return paymentData;
};

const recentTransactions = async (query: Record<string, unknown>, options: TPaginationOptions) => {
  const AndConditions: Prisma.PaymentWhereInput[] = [];

  const { searchTerm, ...filterQuery } = query;

  // Add search term condition
  if (searchTerm) {
    AndConditions.push({
      OR: [
        ...paymentSearchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
        {
          user: {
            is: {
              OR: [
                { firstName: { contains: searchTerm, mode: "insensitive" } },
                { lastName: { contains: searchTerm, mode: "insensitive" } },
                { email: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          } as Prisma.UserWhereInput,
        },
      ],
    });
  }

  // Add filterQuery conditions
  if (Object.keys(filterQuery).length > 0) {
    AndConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  const whereConditions: Prisma.PaymentWhereInput =
    AndConditions.length > 0 ? { AND: AndConditions } : {};

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const result = await prisma.payment.findMany({
    where: whereConditions,
    include: {
      user: {
        select: {
          profilePicture: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          role: true,
        },
      },
      subscription: {
        include: {
          package: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.payment.count({
    where: {
      status: PAYMENT_STATUS.PAID,
    },
  });

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const singleTransaction = (id: string) => {
  return prisma.payment.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          profilePicture: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
      subscription: true,
    },
  });
};

export const PaymentServices = {
  //createPaymentLink,
  verifyPaymentWithWebhook,
  updateSubscriptionVerifyPaymentWithWebhook,
  getPaymentFromDb,
  recentTransactions,
  singleTransaction,
};
