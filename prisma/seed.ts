/**
 * Database Seeding Script / Veritabanı Seeding Scripti
 * This script populates the database with sample data
 * Bu script veritabanını nümunə məlumatlarla doldurur
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding... / Veritabanı seeding başlayır...');

  // Create categories / Kateqoriyalar yarat
  console.log('📁 Creating categories... / Kateqoriyalar yaradılır...');
  
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        name: 'Electronics / Elektronika',
        description: 'Electronic devices and gadgets / Elektron cihazlar və qadjetlər',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { id: '2' },
      update: {},
      create: {
        id: '2',
        name: 'Fashion / Moda',
        description: 'Clothing and accessories / Geyim və aksesuarlar',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { id: '3' },
      update: {},
      create: {
        id: '3',
        name: 'Home & Garden / Ev və Bağ',
        description: 'Home improvement and garden supplies / Ev təmir və bağ ləvazimatları',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { id: '4' },
      update: {},
      create: {
        id: '4',
        name: 'Sports / İdman',
        description: 'Sports equipment and fitness / İdman avadanlığı və fitnes',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { id: '5' },
      update: {},
      create: {
        id: '5',
        name: 'Books / Kitablar',
        description: 'Books and educational materials / Kitablar və təhsil materialları',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories / ${categories.length} kateqoriya yaradıldı`);

  // Create admin user / Admin istifadəçi yarat
  console.log('👑 Creating admin user... / Admin istifadəçi yaradılır...');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@yusu.com' },
    update: {},
    create: {
      id: 'admin-1',
      email: 'admin@yusu.com',
      name: 'Admin User / Admin İstifadəçi',
      role: 'ADMIN',
      phone: '+994501234567',
      isActive: true,
    },
  });

  console.log('✅ Admin user created / Admin istifadəçi yaradıldı');

  // Create seller users / Satıcı istifadəçilər yarat
  console.log('🏪 Creating seller users... / Satıcı istifadəçilər yaradılır...');
  
  const sellers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'seller1@yusu.com' },
      update: {},
      create: {
        id: 'seller-1',
        email: 'seller1@yusu.com',
        name: 'Tech Store / Texnoloji Mağaza',
        role: 'SELLER',
        phone: '+994501234568',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'seller2@yusu.com' },
      update: {},
      create: {
        id: 'seller-2',
        email: 'seller2@yusu.com',
        name: 'Fashion Hub / Moda Mərkəzi',
        role: 'SELLER',
        phone: '+994501234569',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${sellers.length} sellers / ${sellers.length} satıcı yaradıldı`);

  // Create courier users / Kuryer istifadəçilər yarat
  console.log('🚚 Creating courier users... / Kuryer istifadəçilər yaradılır...');
  
  const couriers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'courier1@yusu.com' },
      update: {},
      create: {
        id: 'courier-1',
        email: 'courier1@yusu.com',
        name: 'John Courier / Con Kuryer',
        role: 'COURIER',
        phone: '+994501234570',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'courier2@yusu.com' },
      update: {},
      create: {
        id: 'courier-2',
        email: 'courier2@yusu.com',
        name: 'Jane Delivery / Ceyn Çatdırılma',
        role: 'COURIER',
        phone: '+994501234571',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${couriers.length} couriers / ${couriers.length} kuryer yaradıldı`);

  // Create sample products / Nümunə məhsullar yarat
  console.log('📦 Creating sample products... / Nümunə məhsullar yaradılır...');
  
  const products = [
    // Electronics / Elektronika
    {
      id: 'prod-1',
      name: 'iPhone 15 Pro / iPhone 15 Pro',
      description: 'Latest iPhone with advanced camera system / Ən son iPhone ilə təkmilləşdirilmiş kamera sistemi',
      price: 999.99,
      images: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
      categoryId: '1',
      sellerId: 'seller-1',
      stock: 50,
      isActive: true,
    },
    {
      id: 'prod-2',
      name: 'MacBook Pro 16" / MacBook Pro 16"',
      description: 'Powerful laptop for professionals / Peşəkarlar üçün güclü noutbuk',
      price: 2499.99,
      images: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
      categoryId: '1',
      sellerId: 'seller-1',
      stock: 25,
      isActive: true,
    },
    {
      id: 'prod-3',
      name: 'Sony WH-1000XM5 Headphones / Sony WH-1000XM5 Qulaqlıq',
      description: 'Premium noise-canceling headphones / Premium səs-kəsici qulaqlıq',
      price: 399.99,
      images: 'https://images.unsplash.com/photo-1505740420928-5e880c94d7c0?w=400&h=400&fit=crop',
      categoryId: '1',
      sellerId: 'seller-1',
      stock: 100,
      isActive: true,
    },
    // Fashion / Moda
    {
      id: 'prod-4',
      name: 'Designer T-Shirt / Dizayner T-Şort',
      description: 'Comfortable cotton t-shirt / Rahat pambıq t-şort',
      price: 29.99,
      images: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      categoryId: '2',
      sellerId: 'seller-2',
      stock: 200,
      isActive: true,
    },
    {
      id: 'prod-5',
      name: 'Leather Jacket / Dəri Ceket',
      description: 'Genuine leather jacket / Həqiqi dəri ceket',
      price: 199.99,
      images: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
      categoryId: '2',
      sellerId: 'seller-2',
      stock: 75,
      isActive: true,
    },
    // Home & Garden / Ev və Bağ
    {
      id: 'prod-6',
      name: 'Smart Home Speaker / Ağıllı Ev Hoparlörü',
      description: 'Voice-controlled smart speaker / Səs ilə idarə olunan ağıllı hoparlör',
      price: 149.99,
      images: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
      categoryId: '3',
      sellerId: 'seller-1',
      stock: 80,
      isActive: true,
    },
    // Sports / İdman
    {
      id: 'prod-7',
      name: 'Yoga Mat / Yoga Matı',
      description: 'Non-slip yoga mat for exercise / Məşq üçün sürüşməz yoga matı',
      price: 39.99,
      images: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
      categoryId: '4',
      sellerId: 'seller-2',
      stock: 150,
      isActive: true,
    },
    // Books / Kitablar
    {
      id: 'prod-8',
      name: 'Programming Book / Proqramlaşdırma Kitabı',
      description: 'Learn modern web development / Müasir veb inkişafı öyrənin',
      price: 49.99,
      images: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
      categoryId: '5',
      sellerId: 'seller-1',
      stock: 300,
      isActive: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }

  console.log(`✅ Created ${products.length} products / ${products.length} məhsul yaradıldı`);

  // Create sample addresses / Nümunə ünvanlar yarat
  console.log('📍 Creating sample addresses... / Nümunə ünvanlar yaradılır...');
  
  const addresses = [
    {
      id: 'addr-1',
      userId: 'admin-1',
      street: 'Nizami Street 123 / Nizami küçəsi 123',
      city: 'Baku / Bakı',
      state: 'Baku / Bakı',
      zipCode: 'AZ1000',
      country: 'Azerbaijan / Azərbaycan',
      isDefault: true,
    },
    {
      id: 'addr-2',
      userId: 'seller-1',
      street: '28 May Street 45 / 28 May küçəsi 45',
      city: 'Baku / Bakı',
      state: 'Baku / Bakı',
      zipCode: 'AZ1001',
      country: 'Azerbaijan / Azərbaycan',
      isDefault: true,
    },
  ];

  for (const address of addresses) {
    await prisma.address.upsert({
      where: { id: address.id },
      update: {},
      create: address,
    });
  }

  console.log(`✅ Created ${addresses.length} addresses / ${addresses.length} ünvan yaradıldı`);

  console.log('🎉 Database seeding completed! / Veritabanı seeding tamamlandı!');
  console.log('\n📋 Created accounts / Yaradılan hesablar:');
  console.log('👑 Admin: admin@yusu.com');
  console.log('🏪 Seller 1: seller1@yusu.com');
  console.log('🏪 Seller 2: seller2@yusu.com');
  console.log('🚚 Courier 1: courier1@yusu.com');
  console.log('🚚 Courier 2: courier2@yusu.com');
  console.log('\n💡 Note: Use OAuth providers for authentication / Qeyd: Autentifikasiya üçün OAuth provider-ları istifadə edin');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed / Seeding uğursuz oldu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
