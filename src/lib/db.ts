/**
 * Seller Database Connection Utility / Seller Veritabanı Bağlantı Utility-si
 * This utility provides a singleton Prisma client instance for seller module
 * Bu utility seller modulu üçün singleton Prisma client instance təmin edir
 */

import { PrismaClient } from '@prisma/client';

// Global variable to store Prisma client / Prisma client-i saxlamaq üçün global dəyişən
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client instance / Prisma client instance yarat
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// In development, store the client globally to prevent multiple instances / İnkişafda, çoxlu instance-ları qarşısını almaq üçün client-i global olaraq saxla
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Database connection test function / Veritabanı bağlantı test funksiyası
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Seller database connected successfully / Seller veritabanı uğurla bağlandı');
    return true;
  } catch (error) {
    console.error('❌ Seller database connection failed / Seller veritabanı bağlantısı uğursuz oldu:', error);
    return false;
  }
}

// Graceful shutdown function / Zərif bağlanma funksiyası
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('🔌 Seller database disconnected / Seller veritabanı bağlandı');
  } catch (error) {
    console.error('❌ Error disconnecting seller database / Seller veritabanı bağlama xətası:', error);
  }
}

// Health check function / Sağlamlıq yoxlama funksiyası
export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}

// Seller specific database functions / Seller xüsusi veritabanı funksiyaları
export async function getSellerStats(sellerId: string) {
  try {
    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      lowStockProducts
    ] = await Promise.all([
      prisma.product.count({ where: { sellerId } }),
      prisma.order.count({ where: { sellerId } }),
      prisma.order.aggregate({
        where: { 
          sellerId,
          status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] }
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({ where: { sellerId, status: 'PENDING' } }),
      prisma.product.count({ where: { sellerId, stock: { lt: 10 } } })
    ]);

    return {
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingOrders,
      lowStockProducts
    };
  } catch (error) {
    console.error('Error fetching seller stats / Seller statistikalarını əldə etmə xətası:', error);
    return null;
  }
}

// Export default prisma client / Prisma client-i default olaraq export et
export default prisma;

// Export as db for compatibility / Uyğunluq üçün db kimi export et
export const db = prisma;
