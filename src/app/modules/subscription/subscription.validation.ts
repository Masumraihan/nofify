import { z } from "zod";

const createSubscriptionSchema = z.object({
  body: z.object({
    packageId: z.string({ required_error: "Package ID is required" }),
  }),
});

const updateSubscription = z.object({
  body: z.object({
    packageId: z.string().optional(),
  }),
});

export const SubscriptionValidation = {
  createSubscriptionSchema,
  updateSubscription,
};
