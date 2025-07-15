import { StripeSubscriptionMode } from "@prisma/client";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  body: z.object({
    packageId: z.string({ required_error: "Package ID is required" }),
    mode: z.enum([...(Object.keys(StripeSubscriptionMode) as [string, ...string[]])]).optional(),
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
