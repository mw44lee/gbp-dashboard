import { PrismaClient } from "@prisma/client";

// One shared client for the process — Prisma pools connections internally,
// so route handlers/services just import this instead of `new PrismaClient()` each time.
export const prisma = new PrismaClient();
