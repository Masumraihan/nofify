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
    const superAdminData = await prisma.user.findFirst({
      where: {
        role: USER_ROLE.SUPER_ADMIN,
        email: superAdmin.email,
        isDelete: false,
      },
    });

    if (!superAdminData) {
      const hashedPassword = await bcrypt.hash("superAdmin123", Number(config.bcrypt_salt_rounds));
      const result = await prisma.$transaction(async (transactionClient) => {
        const result = await transactionClient.user.create({
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
        await transactionClient.validation.create({
          data: {
            userId: result.id,
            isVerified: true,
          },
        });
      });

      return result;
    }
  } catch (error) {
    console.log(error);
  }
};
export default seedSuperAdmin;
