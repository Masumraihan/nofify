import { z } from "zod";

const sendCoinsSchema = z.object({
  body: z.object({
    assignTaskId: z.string({ required_error: "Assign Task ID is required" }),
    coin: z.number({ required_error: "Coin is required" }),
  }),
});

export const CoinValidations = { sendCoinsSchema };
