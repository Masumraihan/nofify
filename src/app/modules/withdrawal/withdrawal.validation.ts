import { z } from "zod";

const createWithdrawalValidationSchema = z.object({
  body: z.object({
    coin: z
      .number({ required_error: "Coin is required" })
      .positive({ message: "Coin must be positive" })
      .min(50000, {
        message: "Coin  ",
      }),
  }),
});

export const WithdrawalValidations = {
  createWithdrawalValidationSchema,
};
