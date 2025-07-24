import { StripeSubscriptionMode, User } from "@prisma/client";
import Stripe from "stripe";
import { stripe } from "../../constant/stripe";
import prisma from "../../shared/prisma";
import config from "../../config";
import { TTokenUser } from "../../types/common";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Request } from "express";

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
  mode,
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
  mode: StripeSubscriptionMode;
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
    mode,
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
  const response = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
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

const cancelSubscription = async (user: TTokenUser) => {
  // Step 1: Get user from DB
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userData || !userData.stripeSubscriptionId) {
    throw new AppError(StatusCodes.NOT_FOUND, "Active subscription not found.");
  }

  // Step 2: Cancel subscription in Stripe
  await stripe.subscriptions.update(userData.stripeSubscriptionId, {
    cancel_at_period_end: true, // or false if you want to cancel immediately
  });

  // Step 3: Update user status in DB
  await prisma.user.update({
    where: { id: userData.id },
    data: {
      isSubscriptionActive: false,
      stripeSubscriptionId: null,
    },
  });

  return null;
};

const getStripeProductPriceId = async ({
  productId,
  price,
}: {
  productId: string;
  price: number;
}) => {
  console.log({ productId, price });
  // Step 1: Try to find existing price for the product
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });

  // Step 2: Check if price already exists with same amount and interval
  let existingPrice = prices.data.find(
    (p) =>
      p.unit_amount === price * 100 &&
      p.currency === "usd" &&
      p.recurring?.interval === (config.nodeEnv === "production" ? "month" : "day"),
  );

  // Step 3: If no matching price found, create one
  if (!existingPrice) {
    existingPrice = await stripe.prices.create({
      product: productId,
      unit_amount: price * 100,
      recurring: {
        interval: config.nodeEnv === "production" ? "month" : "day",
      },
      currency: "usd",
    });
  }

  // Step 4: Use existingPrice.id for checkout/session/etc.
  return existingPrice.id;
};

const getPaymentLinkForProduct = async (user: TTokenUser) => {
  // CHECK IF ALREADY HAVE ACTIVE SUBSCRIPTION OR NOT

  const isAlreadySubscribed = await prisma.user.findFirst({
    where: {
      id: user.id,
      isSubscriptionActive: true,
    },
  });

  if (isAlreadySubscribed) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You are already subscribed.");
  }

  // Step 1: Get or create the price ID
  const priceId = await getStripeProductPriceId({
    productId: config.payment.productIdOne as string,
    price: Number(config.payment.productPriceOne as string),
  });

  // Step 2: Create the checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
    },
    customer_email: user.email, // Optional: prefill customer email
    success_url: `${config.server_url}/api/v1/subscription/success`, //?sessionId={CHECKOUT_SESSION_ID}&${urlQuery.toString()}
    cancel_url: `${config.server_url}/api/v1/subscription/success?success=false`,
  });

  // SET SUBSCRIPTION ID INTO USER PROFILE FOR ANY FUTURE ACTION LIKE CANCELLATION
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      stripeSubscriptionId: session.subscription as string,
    },
  });

  return session.url; // Return URL to redirect the user
};

const webhook = async (req: Request) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const sig = req.headers["stripe-signature"] as string | undefined;

  if (!sig) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Missing Stripe signature header.");
  }

  let event: Stripe.Event;

  try {
    // Ensure raw body is passed (you must extract raw body from the request middleware level)
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        if (!userId) {
          console.warn("Missing userId in session metadata.");
          break;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          console.warn(`User not found for ID: ${userId}`);
          break;
        }

        const referredUser = await prisma.user.findUnique({
          where: { code: user.code },
        });

        if (referredUser) {
          // Give referred user 200 coins
          await prisma.user.update({
            where: { id: referredUser.id },
            data: { totalCoins: { increment: 200 } },
          });
        }

        // Give main user coins
        await prisma.user.update({
          where: { id: user.id },
          data: {
            totalCoins: {
              increment: referredUser ? 200 : 400,
            },
            isSubscriptionActive: true,
          },
        });

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("💸 Subscription payment succeeded", invoice);
        // Optionally: Add coins/credits based on invoice.customer
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("❌ Subscription canceled", subscription);
        // Optionally: Disable user's subscription
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error("Error handling Stripe webhook event", err);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Internal error processing webhook event: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
    );
  }
};

export const StripeServices = {
  //paymentLink,
  verifyPayment,
  createPaymentLink,
  refundPayment,
  cancelSubscription,
  getPaymentLinkForProduct,
  webhook,
};
