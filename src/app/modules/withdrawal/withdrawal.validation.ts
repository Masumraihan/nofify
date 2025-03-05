import { z } from "zod";

const createWithdrawalValidationSchema = z.object({
  body: z.object({
    coin: z
      .number({ required_error: "Coin is required" })
      .positive({ message: "Coin must be positive" }),
  }),
});

export const WithdrawalValidations = {
  createWithdrawalValidationSchema,
};
