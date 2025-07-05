import bcrypt from "bcryptjs";
import { USER_ROLE } from "../app/enums";
import prisma from "../app/shared/prisma";
import config from "../app/config";

const superAdmin = {
  firstName: "Super",
  lastName: "Admin",
  email: "super.admin@gmail.com",
  address: "Dhaka",
  mobile: "01700000000",
  role: USER_ROLE.SUPER_ADMIN,
};

const seedSuperAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("superAdmin123", Number(config.bcrypt_salt_rounds));

    await prisma.$transaction(
      async (tx) => {
        let superAdminData = await tx.user.findFirst({
          where: {
            role: USER_ROLE.SUPER_ADMIN,
            email: superAdmin.email,
            isDelete: false,
          },
        });

        if (!superAdminData) {
          superAdminData = await tx.user.create({
            data: {
              firstName: superAdmin.firstName,
              lastName: superAdmin.lastName,
              email: superAdmin.email,
              phoneNumber: superAdmin.mobile,
              role: superAdmin.role,
              password: hashedPassword,
              profilePicture: "https://goto.now/lcP4v",
              isDelete: false,
              isActive: true,
              code: `NOFIFY-001`,
              signUpMethod: "EMAIL",
            },
          });

          await tx.validation.create({
            data: {
              userId: superAdminData.id,
              isVerified: true,
            },
          });
        }

        // Predefined categories and subcategories
        const predefinedCategories = [
          { category: "Home", subCategory: "Head Of Household" },
          { category: "Work", subCategory: "Manager" },
          { category: "Education", subCategory: "Teacher" },
        ];

        // Get all existing category names
        const existingCategories = await tx.category.findMany({
          where: {
            name: {
              in: predefinedCategories.map((item) => item.category),
            },
          },
        });

        const existingCategoryNames = existingCategories.map((cat) => cat.name);

        const categoriesToCreate = predefinedCategories.filter(
          (item) => !existingCategoryNames.includes(item.category),
        );

        // Sequential creation to ensure transaction safety
        for (const { category, subCategory } of categoriesToCreate) {
          const createdCategory = await tx.category.create({
            data: {
              name: category,
              userId: superAdminData.id,
            },
          });

          await tx.subCategory.create({
            data: {
              name: subCategory,
              userId: superAdminData.id,
              categoryId: createdCategory.id,
            },
          });
        }
      },
      {
        maxWait: 60000,
        timeout: 60000,
      },
    );

    console.log("Super Admin and predefined categories are seeded successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
    throw new Error("Super Admin seeding failed.");
  }
};

export default seedSuperAdmin;
