import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

let isConnected = false

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    isConnected = true
    return true
  } catch (err) {
    isConnected = false
    return false
  }
}

export function isDbConnected(): boolean {
  return isConnected
}
