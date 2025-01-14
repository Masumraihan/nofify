import { z } from "zod";

const cratePackageValidation = z.object({
  body: z
    .object({
      name: z.string({ required_error: "Name is required" }),
      coin: z
        .number({ required_error: "Coin is required" })
        .positive({ message: "Coin must be positive" }),
      description: z.string({ required_error: "Description is required" }),
      price: z
        .number({ required_error: "Price is required" })
        .positive({ message: "Price must be positive" }),
    })
    .strict(),
});

const updatePackageValidation = z.object({
  body: z
    .object({
      name: z.string().optional(),
      price: z.number().optional(),
      coin: z.number().optional(),
      description: z.string().optional(),
    })
    .strict(),
});

export const PackageValidations = {
  cratePackageValidation,
  updatePackageValidation,
};
