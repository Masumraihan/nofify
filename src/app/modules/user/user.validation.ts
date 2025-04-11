import { z } from "zod";

// User Schema
const userSchema = z.object({
  body: z
    .object({
      isActive: z
        .boolean()
        .optional()
        .refine((val) => val !== undefined, {
          message: "isActive is an optional field",
        }),
    })
    .strict(),
});

// Update Profile Validation Schema
export const updateProfileValidationSchema = z
  .object({
    profilePicture: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    phoneNumber: z.string().optional(),
    fcmToken: z.string().optional(),
  })
  .strict();

export const UserValidations = {
  userSchema,
  updateProfileValidationSchema,
};
