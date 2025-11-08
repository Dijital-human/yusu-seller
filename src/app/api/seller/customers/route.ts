/**
 * Customers API Route / Müştərilər API Route-u
 * This route handles customer list for sellers
 * Bu route satıcılar üçün müştəri siyahısını idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/customers
 * Get all customers for seller / Satıcı üçün bütün müştəriləri al
 * Query params: search, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const { actualSellerId } = await getActualSellerId(session.user.id);

    // Get query parameters / Query parametrlərini al
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let orders;

    try {
      // Get all orders for this seller / Bu satıcı üçün bütün sifarişləri al
      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET customers');
      if (errorResponse) return errorResponse;

      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Group orders by customer / Sifarişləri müştəriyə görə qruplaşdır
    const customerMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: Date;
      firstOrderDate: Date;
      orders: any[];
    }>();

    orders.forEach(order => {
      if (!order.customer) return;
      
      const customerId = order.customer.id;
      const existing = customerMap.get(customerId);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += Number(order.totalAmount);
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
        }
        if (order.createdAt < existing.firstOrderDate) {
          existing.firstOrderDate = order.createdAt;
        }
        existing.orders.push(order);
      } else {
        customerMap.set(customerId, {
          id: customerId,
          name: order.customer.name || 'Unknown',
          email: order.customer.email || '',
          phone: order.customer.phone,
          totalOrders: 1,
          totalSpent: Number(order.totalAmount),
          lastOrderDate: order.createdAt,
          firstOrderDate: order.createdAt,
          orders: [order],
        });
      }
    });

    // Convert map to array / Map-i array-ə çevir
    let customers = Array.from(customerMap.values());

    // Apply search filter if provided / Təmin edilərsə axtarış filtrini tətbiq et
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(search))
      );
    }

    // Calculate metrics / Metrikaları hesabla
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageOrderValue = customers.reduce((sum, c) => sum + (c.totalSpent / c.totalOrders), 0) / (customers.length || 1);
    const averageOrdersPerCustomer = totalCustomers > 0 ? customers.reduce((sum, c) => sum + c.totalOrders, 0) / totalCustomers : 0;

    // Sort by total spent (descending) / Ümumi xərclənmiş məbləğə görə sırala (azalan)
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    // Apply pagination / Pagination tətbiq et
    const paginatedCustomers = customers.slice(skip, skip + limit);

    // Get customer satisfaction (average rating from reviews) and location (from addresses)
    // Müştəri məmnuniyyətini (review-lərdən orta rating) və məkanını (address-lərdən) al
    // Optimize: Only fetch data for paginated customers / Optimizasiya: Yalnız paginated müştərilər üçün məlumat al
    const customerIds = paginatedCustomers.map(c => c.id);
    
    // Optimize: Fetch all data in parallel / Optimizasiya: Bütün məlumatları paralel al
    const orderIds = paginatedCustomers.flatMap(c => c.orders.map(o => o.id));
    
    // Parallel queries for better performance / Daha yaxşı performans üçün paralel query-lər
    const [reviews, addresses, orderItems] = await Promise.all([
      // Get reviews for customers / Müştərilər üçün review-ləri al
      customerIds.length > 0 ? db.review.findMany({
        where: {
          userId: { in: customerIds },
        },
        select: {
          userId: true,
          rating: true,
        },
      }) : Promise.resolve([]),

      // Get addresses for customers (only most recent per customer) / Müştərilər üçün address-ləri al (yalnız hər müştəri üçün ən son)
      customerIds.length > 0 ? db.address.findMany({
        where: {
          userId: { in: customerIds },
        },
        select: {
          userId: true,
          city: true,
          country: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        // Use distinctOn to get only most recent address per customer (if supported)
        // Hər müştəri üçün yalnız ən son address-i al (dəstəklənirsə)
      }) : Promise.resolve([]),

      // Get order items to calculate preferred category / Üstünlük verilən kateqoriyanı hesablamaq üçün sifariş elementlərini al
      orderIds.length > 0 ? db.orderItem.findMany({
        where: {
          orderId: { in: orderIds },
        },
        select: {
          orderId: true,
          quantity: true,
          product: {
            select: {
              categoryId: true,
            },
          },
        },
      }) : Promise.resolve([]),
    ]);

    // Calculate satisfaction per customer / Müştəri üzrə məmnuniyyəti hesabla
    const satisfactionMap = new Map<string, number[]>();
    reviews.forEach(review => {
      const existing = satisfactionMap.get(review.userId) || [];
      existing.push(review.rating);
      satisfactionMap.set(review.userId, existing);
    });

    // Calculate location per customer (most recent address) / Müştəri üzrə məkan (ən son address)
    const locationMap = new Map<string, string>();
    addresses.forEach(address => {
      if (!locationMap.has(address.userId)) {
        const location = [address.city, address.country].filter(Boolean).join(', ');
        if (location) {
          locationMap.set(address.userId, location);
        }
      }
    });

    // Calculate preferred category per customer / Müştəri üzrə üstünlük verilən kateqoriya
    const categoryMap = new Map<string, Map<string, number>>();
    paginatedCustomers.forEach(customer => {
      const customerOrderIds = customer.orders.map(o => o.id);
      const customerOrderItems = orderItems.filter(item => customerOrderIds.includes(item.orderId));
      
      const categoryCounts = new Map<string, number>();
      customerOrderItems.forEach(item => {
        if (item.product.categoryId) {
          const count = categoryCounts.get(item.product.categoryId) || 0;
          categoryCounts.set(item.product.categoryId, count + item.quantity);
        }
      });

      if (categoryCounts.size > 0) {
        const preferredCategory = Array.from(categoryCounts.entries())
          .sort((a, b) => b[1] - a[1])[0][0];
        categoryMap.set(customer.id, new Map([['preferred', preferredCategory]]));
      }
    });

    // Format customer data / Müştəri məlumatlarını formatla
    const formattedCustomers = paginatedCustomers.map(customer => {
      const ratings = satisfactionMap.get(customer.id) || [];
      const averageSatisfaction = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : undefined;
      
      const location = locationMap.get(customer.id);
      const preferredCategory = categoryMap.get(customer.id)?.get('preferred');

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalOrders: customer.totalOrders,
        totalSpent: Number(customer.totalSpent.toFixed(2)),
        averageOrderValue: Number((customer.totalSpent / customer.totalOrders).toFixed(2)),
        lastOrderDate: customer.lastOrderDate.toISOString(),
        customerSince: customer.firstOrderDate.toISOString(),
        status: customer.lastOrderDate > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) ? 'active' : 'inactive' as 'active' | 'inactive',
        satisfaction: averageSatisfaction ? Number(averageSatisfaction.toFixed(1)) : undefined,
        location: location || undefined,
        preferredCategory: preferredCategory || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      customers: formattedCustomers,
      metrics: {
        totalCustomers,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        averageOrdersPerCustomer: Number(averageOrdersPerCustomer.toFixed(2)),
      },
      pagination: {
        page,
        limit,
        total: totalCustomers,
        pages: Math.ceil(totalCustomers / limit),
      },
    });

  } catch (error: any) {
    console.error("Error fetching customers / Müştəriləri əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

