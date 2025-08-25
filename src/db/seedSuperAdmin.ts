import bcrypt from "bcryptjs";
import { USER_ROLE } from "../app/enums";
import prisma from "../app/shared/prisma";
import config from "../app/config";
import { generateReferCode } from "../app/modules/auth/auth.utils";

const superAdmin = {
  firstName: "Super",
  lastName: "Admin",
  email: "olanrewajuajilore3@gmail.com",
  address: "Lagos, Nigeria",
  mobile: "+18338563186",
  role: USER_ROLE.SUPER_ADMIN,
};

const seedSuperAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("superAdmin123", Number(config.bcrypt_salt_rounds));

    const superAdminData = await prisma.$transaction(
      async (tx) => {
        let seedSuperAdminData = await tx.user.findFirst({
          where: {
            role: USER_ROLE.SUPER_ADMIN,
            email: superAdmin.email,
            isDelete: false,
          },
        });

        if (!seedSuperAdminData) {
          seedSuperAdminData = await tx.user.create({
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
              code: await generateReferCode(),
              signUpMethod: "EMAIL",
            },
          });

          await tx.validation.create({
            data: {
              userId: seedSuperAdminData.id,
              isVerified: true,
            },
          });
        }
        return seedSuperAdminData;
      },
      {
        maxWait: 60000,
        timeout: 60000,
      },
    );

    // Predefined categories and subcategories
    const predefinedCategories = [
      { category: "Home", subCategory: "Head Of Household" },
      { category: "Work", subCategory: "Manager" },
      { category: "Education", subCategory: "Teacher" },
    ];

    //const deleteAllSubCategory = await prisma.subCategory.deleteMany({});
    //const deleteAllCategory = await prisma.category.deleteMany({});

    // Get all existing category names
    const existingCategories = await prisma.category.findMany({
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
      const createdCategory = await prisma.category.create({
        data: {
          name: category,
          userId: superAdminData.id,
        },
      });

      await prisma.subCategory.create({
        data: {
          name: subCategory,
          userId: superAdminData.id,
          categoryId: createdCategory.id,
        },
      });
    }

    console.log("Super Admin and predefined categories are seeded successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
    throw new Error("Super Admin seeding failed.");
  }
};

export default seedSuperAdmin;
