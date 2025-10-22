// yusu-seller/src/lib/seller-api-test.ts
// Seller API Test Script / Seller API Test Skripti
// This script tests all seller API endpoints / Bu skript bütün seller API endpoint-lərini test edir

import { prisma } from './db';
import { OrderStatus, UserRole } from '@prisma/client';

// Test data / Test məlumatları
const testData = {
  sellerEmail: 'seller@yusu.com',
  testProduct: {
    name: 'Test Seller Product',
    description: 'Test product for seller',
    price: 49.99,
    stock: 20,
    isActive: true,
    images: ['https://example.com/image1.jpg'],
  },
  testOrder: {
    status: OrderStatus.PENDING,
    totalAmount: 99.98,
    shippingAddress: JSON.stringify({ 
      street: 'Test Seller St', 
      city: 'Test Seller City',
      postalCode: '12345'
    }),
  }
};

async function runSellerApiTests() {
  console.log("🧪 Starting Seller API Tests / Seller API Testləri Başlayır...");

  // 1. Test database connection
  console.log("\n1️⃣ Testing database connection / Veritabanı bağlantısını test edir...");
  try {
    await prisma.$connect();
    console.log("✅ Database connected / Veritabanı bağlandı");
  } catch (error) {
    console.error("❌ Database connection failed / Veritabanı bağlantısı uğursuz oldu:", error);
    process.exit(1);
  }

  // 2. Test seller user retrieval
  console.log("\n2️⃣ Testing seller user retrieval / Seller istifadəçi əldə etməni test edir...");
  const sellerUser = await prisma.user.findFirst({ 
    where: { 
      role: UserRole.SELLER,
      isActive: true 
    } 
  });
  
  if (sellerUser) {
    console.log(`✅ Seller user found: ${sellerUser.email} (${sellerUser.name}) / Seller istifadəçi: ${sellerUser.email} (${sellerUser.name})`);
  } else {
    console.error("❌ No seller user found / Seller istifadəçi tapılmadı");
    process.exit(1);
  }

  // 3. Test categories retrieval
  console.log("\n3️⃣ Testing categories retrieval / Kateqoriya əldə etməni test edir...");
  const category = await prisma.category.findFirst();
  if (category) {
    console.log(`✅ Category found: ${category.name} / Kateqoriya tapıldı: ${category.name}`);
  } else {
    console.error("❌ No categories found / Kateqoriya tapılmadı");
    process.exit(1);
  }

  // 4. Test product creation
  console.log("\n4️⃣ Testing product creation / Məhsul yaratmanı test edir...");
  let testProductId: string;
  const existingTestProduct = await prisma.product.findFirst({ 
    where: { name: testData.testProduct.name } 
  });
  
  if (existingTestProduct) {
    testProductId = existingTestProduct.id;
    console.log("⚠️ Test product already exists, skipping creation / Test məhsul artıq mövcuddur, yaratma atlanır");
  } else {
    const newProduct = await prisma.product.create({
      data: {
        ...testData.testProduct,
        categoryId: category!.id,
        sellerId: sellerUser!.id,
        images: JSON.stringify(testData.testProduct.images),
      },
    });
    testProductId = newProduct.id;
    console.log("✅ Test product created / Test məhsul yaradıldı");
  }

  // 5. Test customer creation for order
  console.log("\n5️⃣ Testing customer creation / Müştəri yaratmanı test edir...");
  let testCustomerId: string;
  const existingTestCustomer = await prisma.user.findFirst({ 
    where: { email: 'test-customer@example.com' } 
  });
  
  if (existingTestCustomer) {
    testCustomerId = existingTestCustomer.id;
    console.log("⚠️ Test customer already exists, skipping creation / Test müştəri artıq mövcuddur, yaratma atlanır");
  } else {
    const newCustomer = await prisma.user.create({
      data: {
        email: 'test-customer@example.com',
        name: 'Test Customer',
        role: UserRole.CUSTOMER,
        isActive: true,
      },
    });
    testCustomerId = newCustomer.id;
    console.log("✅ Test customer created / Test müştəri yaradıldı");
  }

  // 6. Test order creation
  console.log("\n6️⃣ Testing order creation / Sifariş yaratmanı test edir...");
  let testOrderId: string;
  const existingTestOrder = await prisma.order.findFirst({ 
    where: { 
      customerId: testCustomerId, 
      sellerId: sellerUser!.id,
      status: OrderStatus.PENDING 
    } 
  });
  
  if (existingTestOrder) {
    testOrderId = existingTestOrder.id;
    console.log("⚠️ Test order already exists, skipping creation / Test sifariş artıq mövcuddur, yaratma atlanır");
  } else {
    const newOrder = await prisma.order.create({
      data: {
        customerId: testCustomerId,
        sellerId: sellerUser!.id,
        ...testData.testOrder,
        items: {
          create: [
            { 
              productId: testProductId, 
              quantity: 2, 
              price: testData.testProduct.price 
            }
          ],
        },
      },
    });
    testOrderId = newOrder.id;
    console.log("✅ Test order created / Test sifariş yaradıldı");
  }

  // 7. Test seller statistics
  console.log("\n7️⃣ Testing seller statistics / Seller statistikalarını test edir...");
  const sellerStats = {
    totalProducts: await prisma.product.count({ where: { sellerId: sellerUser!.id } }),
    totalOrders: await prisma.order.count({ where: { sellerId: sellerUser!.id } }),
    pendingOrders: await prisma.order.count({ 
      where: { 
        sellerId: sellerUser!.id, 
        status: OrderStatus.PENDING 
      } 
    }),
    deliveredOrders: await prisma.order.count({ 
      where: { 
        sellerId: sellerUser!.id, 
        status: OrderStatus.DELIVERED 
      } 
    }),
  };

  console.log("📊 Seller Statistics / Seller Statistikaları:");
  console.log(`  - Total Products: ${sellerStats.totalProducts}`);
  console.log(`  - Total Orders: ${sellerStats.totalOrders}`);
  console.log(`  - Pending Orders: ${sellerStats.pendingOrders}`);
  console.log(`  - Delivered Orders: ${sellerStats.deliveredOrders}`);

  // 8. Test product management
  console.log("\n8️⃣ Testing product management / Məhsul idarəetməsini test edir...");
  const sellerProducts = await prisma.product.findMany({
    where: { sellerId: sellerUser!.id },
    include: {
      category: { select: { name: true } },
      _count: { select: { orderItems: true } },
    },
    take: 3,
  });

  console.log("📦 Seller Products / Seller Məhsulları:");
  sellerProducts.forEach((product, i) => {
    console.log(`  ${i + 1}. ${product.name} - $${product.price.toFixed(2)} (Stock: ${product.stock})`);
  });

  // 9. Test order management
  console.log("\n9️⃣ Testing order management / Sifariş idarəetməsini test edir...");
  const sellerOrders = await prisma.order.findMany({
    where: { sellerId: sellerUser!.id },
    include: {
      customer: { select: { name: true, email: true } },
      items: { 
        include: { 
          product: { select: { name: true } } 
        } 
      },
    },
    take: 3,
  });

  console.log("🛒 Seller Orders / Seller Sifarişləri:");
  sellerOrders.forEach((order, i) => {
    console.log(`  ${i + 1}. Order ${order.id.substring(0, 8)}... - $${order.totalAmount.toFixed(2)} (${order.status})`);
  });

  // 10. Clean up test data
  console.log("\n🔟 Cleaning up test data / Test məlumatlarını təmizləyir...");
  try {
    // Delete order items first
    await prisma.orderItem.deleteMany({ 
      where: { orderId: testOrderId } 
    });
    
    // Delete order
    await prisma.order.delete({ 
      where: { id: testOrderId } 
    });
    
    // Delete test product
    await prisma.product.delete({ 
      where: { id: testProductId } 
    });
    
    // Delete test customer
    await prisma.user.delete({ 
      where: { id: testCustomerId } 
    });
    
    console.log("✅ Test data cleaned up / Test məlumatları təmizləndi");
  } catch (error) {
    console.error("❌ Failed to clean up test data / Test məlumatlarını təmizləmək uğursuz oldu:", error);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed / Veritabanı bağlantısı bağlandı");
  }

  console.log("\n🎉 All Seller API tests completed successfully! / Bütün Seller API testləri uğurla tamamlandı!");
}

// If this script is run directly, execute the test
if (require.main === module) {
  runSellerApiTests();
}

export { runSellerApiTests };
