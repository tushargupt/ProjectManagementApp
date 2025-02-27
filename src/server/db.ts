// src/server/db.ts
import { PrismaClient } from "@prisma/client";

// Create a singleton instance of PrismaClient
// Use globalThis to avoid issues with Next.js hot reloading
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Initialize PrismaClient if it doesn't exist already
export const prisma = 
  globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Save PrismaClient to globalThis in development to avoid too many instances
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Export a named alias for consistency
export const db = prisma;