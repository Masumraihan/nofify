import Stripe from "stripe";
import config from "../config";

export const stripe = new Stripe(config.payment.secretKey as string, {
  //apiVersion: "2025-02-24.acacia",
  typescript: true,
});
