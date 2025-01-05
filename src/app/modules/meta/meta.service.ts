import { USER_ROLE } from "../../enums";
import prisma from "../../shared/prisma";

const metaCounts = async () => {
  const totalUserCount = await prisma.user.count({
    where: {
      role: USER_ROLE.USER,
    },
  });

  return {
    totalUsers: totalUserCount || 0,
  };
};

export const MetaServices = {
  metaCounts,
};
