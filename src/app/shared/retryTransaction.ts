import { PrismaClient, Prisma } from "@prisma/client";
import prisma from "./prisma";

export async function retryTransaction<T>(
  fn: (client: Parameters<PrismaClient["$transaction"]>[0]) => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(async (client) => fn(client as any));
    } catch (err: any) {
      lastError = err;

      const isDeadlock =
        err?.message?.includes("Transaction failed due to a write conflict") ||
        err?.message?.includes("deadlock");

      if (!isDeadlock || attempt === retries) throw err;

      console.warn(`Retrying transaction (attempt ${attempt})...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw lastError;
}
