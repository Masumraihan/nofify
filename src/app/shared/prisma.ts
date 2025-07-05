import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 50000,
    timeout: 50000,
  },
});
export default prisma;
