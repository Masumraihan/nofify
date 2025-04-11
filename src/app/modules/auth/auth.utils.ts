import prisma from "../../shared/prisma";

export const generateReferCode = async () => {
  const lastUser = await prisma.user.findFirst({
    orderBy: {
      createdAt: "desc",
    },
  });
  console.log(lastUser);
  if (lastUser) {
    const codeLastNumber = lastUser.code.split("-")[1];
    console.log("codeLastNumber", codeLastNumber);
    const code = `NOFIFY-${Number(codeLastNumber) + 1 || 1}`;
    return code;
  } else {
    return `NOFIFY-001`;
  }
};
