import { z } from "zod";

const createPaymentValidation = z.object({
  body: z.object({
    userId: z.string({ required_error: "Order ID is required" }),
    amount: z
      .number({ required_error: "Amount is required" })
      .positive({ message: "Amount must be positive" }),
  }),
});

const paymentLinkValidation = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }),
  }),
});

export const PaymentValidations = {
  createPaymentValidation,
  paymentLinkValidation,
};
