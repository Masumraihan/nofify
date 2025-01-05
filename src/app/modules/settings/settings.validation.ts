import { z } from "zod";

const createSettingsValidation = z.object({
  body: z
    .object({
      label: z.string({ required_error: "label is required" }),
      content: z.string({ required_error: "Content is required" }),
    })
    .strict(),
});

const updateSettingsValidation = z.object({
  body: z
    .object({
      label: z.string({ required_error: "label is required for find the settings" }),
      content: z.string({ required_error: "Content is required" }).optional(),
    })
    .strict(),
});

export const SettingsValidations = {
  createSettingsValidation,
  updateSettingsValidation,
};
