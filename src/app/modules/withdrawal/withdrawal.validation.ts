import { z } from "zod";

const createWithdrawalValidationSchema = z.object({
  body: z
    .object({
      coin: z
        .number({ required_error: "Coin is required" })
        .positive({ message: "Coin must be positive" })
        .min(5, {
          message: "Coin  ",
        }),
      walletAddress: z.string({ required_error: "Wallet Address is required" }),
    })
    .strict(),
});
const updateWithdrawalValidationSchema = z.object({
  body: z
    .object({
      coin: z
        .number({ required_error: "Coin is required" })
        .positive({ message: "Coin must be positive" })
        .min(5, {
          message: "Coin  ",
        }),
      walletAddress: z.string().optional(),
    })
    .strict()
    .optional(),
});

export const WithdrawalValidations = {
  createWithdrawalValidationSchema,
  updateWithdrawalValidationSchema,
};
