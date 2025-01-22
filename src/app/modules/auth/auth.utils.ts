import prisma from "../../shared/prisma";

export const generateReferCode = async () => {
  const lastUser = await prisma.user.findFirst({
    orderBy: {
      createdAt: "desc",
    },
  });
  console.log({ lastUser });
  if (lastUser) {
    const codeLastNumber = lastUser.code.split("")[lastUser.code.length];

    console.log({ codeLastNumber });

    const code = `NOFIFY-00${Number(codeLastNumber) + 1}`;
    return code;
  } else {
    return `NOFIFY-001`;
  }
};
