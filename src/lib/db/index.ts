/**
 * Database Connection / Veritabanı Bağlantısı
 * This file handles the Prisma client connection and configuration
 * Bu fayl Prisma client bağlantısını və konfiqurasiyasını idarə edir
 */

import { PrismaClient } from '@prisma/client';

// Global variable to store Prisma client instance
// Prisma client instance-ını saxlamaq üçün global dəyişən
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client instance with proper configuration
// Düzgün konfiqurasiya ilə Prisma client instance-ı yaradır
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// In development, store the client in global variable to prevent multiple instances
// Development-da, çoxlu instance-ları qarşısını almaq üçün client-i global dəyişəndə saxlayır
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown function
// Yumşaq bağlanma funksiyası
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Database health check function
// Veritabanı sağlamlıq yoxlaması funksiyası
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
