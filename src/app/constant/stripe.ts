import Stripe from "stripe";
import config from "../config";

export const stripe = new Stripe(config.payment.secretKey as string, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});
