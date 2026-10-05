import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set — configure it in .env (e.g. DATABASE_URL=file:/home/z/my-project/db/custom.db) before starting the app.'
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Errors only — per-request `query` logging floods the dev server output.
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
