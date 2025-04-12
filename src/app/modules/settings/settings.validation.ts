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

const updateTaskRemainderMinutesValidation = z.object({
  body: z
    .object({
      label: z.string({ required_error: "label is required" }),
      value: z
        .number({ required_error: "minutes is required" })
        .positive({ message: "minutes must be positive" }),
    })
    .strict(),
});

export const SettingsValidations = {
  createSettingsValidation,
  updateSettingsValidation,
  updateTaskRemainderMinutesValidation,
};
