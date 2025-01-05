import { Payment, User } from "@prisma/client";
import Stripe from "stripe";
import config from "../../config";
import { stripe } from "../../constant/stripe";
import prisma from "../../shared/prisma";

//const paymentLink = async ({ payment }: { payment: Payment }) => {
//  const user = await prisma.user.findUniqueOrThrow({
//    where: {
//      id: payment.userId,
//      isDelete: false,
//    },
//  });
//  let userStripeId = user.stripeId;

//  if (!userStripeId) {
//    const customer = await stripe.customers.create({
//      email: user.email,
//      name: user.name,
//    });

//    await prisma.user.update({
//      where: {
//        id: user.id,
//        isDelete: false,
//      },
//      data: {
//        stripeId: customer.id,
//      },
//    });

//    userStripeId = customer.id;
//  }

//  const paymentGatewayData = await stripe.checkout.sessions.create({
//    line_items: [
//      {
//        price_data: {
//          currency: "usd",
//          product_data: {
//            name: "Subscription Plan",
//          },
//          unit_amount: payment.amount * 100,
//        },
//        quantity: 1,
//      },
//    ],
//    success_url: `${config.payment.webHookUrl}?sessionId={CHECKOUT_SESSION_ID}&paymentId=${payment.id}&transactionId=${payment.transactionId}`,
//    cancel_url: `${config.payment.paymentCancelUrl}?paymentId=${payment.id}`,
//    mode: "payment",
//    metadata: {
//      user: JSON.stringify({
//        paymentId: payment.id,
//      }),
//    },
//    invoice_creation: {
//      enabled: true,
//    },
//    customer: userStripeId,
//    payment_intent_data: {
//      metadata: {
//        payment: JSON.stringify({
//          ...payment,
//        }),
//      },
//    },
//    payment_method_types: ["card", "amazon_pay", "cashapp", "us_bank_account"],
//  });

//  return paymentGatewayData;
//};

const createPaymentLink = async ({
  user,
  stripeCustomerName,
  amount,
  quantity = 1,
  query,
  metaData,
  paymentIntentDataMetaData,
  cancelUrl,
  name,
  webHookUrl,
}: {
  name: string;
  user: User;
  stripeCustomerName?: string;
  amount: number;
  quantity?: number;
  query?: Record<string, unknown>;
  metaData?: Record<string, unknown>;
  paymentIntentDataMetaData?: Record<string, unknown>;
  cancelUrl: string;
  webHookUrl: string;
}) => {
  const urlQuery = new URLSearchParams();

  if (query && Object.keys(query).length) {
    for (const [key, value] of Object.entries(query)) {
      urlQuery.append(key, value as string);
    }
  }

  let userStripeId = user.stripeId;
  if (!userStripeId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: stripeCustomerName,
    });

    await prisma.user.update({
      where: {
        id: user.id,
        isDelete: false,
      },
      data: {
        stripeId: customer.id,
      },
    });

    userStripeId = customer.id;
  }

  const paymentGatewayData = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name,
          },
          unit_amount: amount * 100,
        },
        quantity: quantity,
      },
    ],
    success_url: `${webHookUrl}?sessionId={CHECKOUT_SESSION_ID}&${urlQuery.toString()}`,
    cancel_url: `${cancelUrl}?${urlQuery.toString()}`,
    mode: "payment",
    metadata: {
      data: JSON.stringify(metaData),
    },
    invoice_creation: {
      enabled: true,
    },
    customer: userStripeId,
    payment_intent_data: {
      metadata: {
        payment: JSON.stringify(paymentIntentDataMetaData),
      },
    },
    payment_method_types: ["card", "amazon_pay", "cashapp", "us_bank_account"],
  });

  return paymentGatewayData;
};

const verifyPayment = async (sessionId: string) => {
  const response = await stripe.checkout.sessions.retrieve(sessionId);
  return response;
};

const refundPayment = async (intendId: string, amount?: number) => {
  const payload: Stripe.RefundCreateParams = {
    payment_intent: intendId,
  };

  if (amount) {
    // convert amount to cents
    payload.amount = amount * 100;
    payload.reason = "requested_by_customer";
  }

  const response = await stripe.refunds.create(payload);
  return response;
};

export const StripeServices = {
  //paymentLink,
  verifyPayment,
  createPaymentLink,
  refundPayment,
};
