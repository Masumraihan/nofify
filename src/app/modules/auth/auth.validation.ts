import { z } from "zod";
import { GENDER, USER_ROLE } from "../../enums";

// User Model Validation
export const signUpValidation = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .min(3, { message: "Name must be at least 3 characters long" })
      .max(50, { message: "Name must be at most 50 characters long" })
      .optional(),
    email: z
      .string()
      .email({ message: "Invalid email format. Please provide a valid email address." })
      .optional(),
    profilePicture: z
      .string()
      .url({ message: "Invalid URL for profile picture. Please provide a valid URL." })
      .optional(),
    //role: z.enum([...Object.keys(USER_ROLE)] as [string, ...string[]], {
    //  message: "Role must be either 'SUPER_ADMIN', 'USER', 'VENDOR' or 'SUB_ADMIN",
    //}),
    city: z.string().optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, {
        message: "Phone number must be in international format and up to 15 digits long",
      })
      .optional(),
    address: z.string().optional(),
    gender: z
      .enum([...Object.keys(GENDER)] as [string, ...string[]], {
        message: "Gender must be either 'MALE' or 'FEMALE'",
      })
      .optional(),
    password: z.string().optional(),
  })
  .strict();

const signInValidation = z.object({
  body: z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email({ message: "Invalid email address" }),
      password: z.string().optional(),
      fcmToken: z.string().optional(),
    })
    .strict(),
});

const refreshTokenValidation = z.object({
  cookies: z
    .object({
      refreshToken: z
        .string({
          required_error: "Refresh token is required!",
        })
        .optional(),
    })
    .strict(),
});

const changePasswordValidation = z.object({
  body: z
    .object({
      oldPassword: z.string({ required_error: "Old password is required" }),
      newPassword: z.string({ required_error: "New password is required" }),
    })
    .strict(),
});

const forgetPasswordValidation = z.object({
  body: z
    .object({
      email: z.string().email({ message: "Invalid email address" }).optional(),
      phoneNumber: z
        .string()
        // accept space in phone number
        .regex(/^\+?[1-9]\d{1,14}$/, {
          message: "Phone number must be in international format and up to 15 digits long",
        })
        .optional(),
      type: z
        .enum(["email", "mobile"], { message: "Type must be either 'email' or 'mobile'" })
        .optional(),
    })
    .strict(),
});

const optValidation = z.object({
  body: z
    .object({
      otp: z.number({ required_error: "OTP is required" }),
    })
    .strict(),
});

const resendOtpValidation = z.object({
  body: z
    .object({
      token: z.string({ required_error: "Email is required" }).optional(),
    })
    .strict()
    .optional(),
});

const resetPasswordValidation = z.object({
  body: z
    .object({
      password: z.string({ required_error: "Password is required" }),
    })
    .strict(),
});

export const AuthValidations = {
  signUpValidation,
  signInValidation,
  refreshTokenValidation,
  forgetPasswordValidation,
  optValidation,
  resendOtpValidation,
  changePasswordValidation,
  resetPasswordValidation,
};
