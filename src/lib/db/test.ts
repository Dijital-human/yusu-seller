/**
 * Database Connection Test / Veritabanı Bağlantı Testi
 * This file tests the database connection and basic operations
 * Bu fayl veritabanı bağlantısını və əsas əməliyyatları test edir
 */

import { prisma } from './index';

export async function testDatabaseConnection() {
  try {
    // Test database connection / Veritabanı bağlantısını test et
    console.log('Testing database connection... / Veritabanı bağlantısı test edilir...');
    
    // Check if we can query the database / Veritabanına sorğu göndərə bilərikmi yoxla
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection successful! / Veritabanı bağlantısı uğurlu!', result);
    
    // Test User model / User modelini test et
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount} / Veritabanında ümumi istifadəçi sayı: ${userCount}`);
    
    // Test Category model / Category modelini test et
    const categoryCount = await prisma.category.count();
    console.log(`Total categories in database: ${categoryCount} / Veritabanında ümumi kateqoriya sayı: ${categoryCount}`);
    
    return true;
  } catch (error) {
    console.error('Database connection failed: / Veritabanı bağlantısı uğursuz:', error);
    return false;
  }
}

// Run test if this file is executed directly / Əgər bu fayl birbaşa işə salınırsa testi çalışdır
if (require.main === module) {
  testDatabaseConnection()
    .then((success) => {
      if (success) {
        console.log('✅ Database test completed successfully! / Veritabanı testi uğurla tamamlandı!');
        process.exit(0);
      } else {
        console.log('❌ Database test failed! / Veritabanı testi uğursuz!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Database test error: / Veritabanı testi xətası:', error);
      process.exit(1);
    });
}
