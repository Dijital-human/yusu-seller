/**
 * Analytics API Route / Analitika API Route-u
 * This route provides analytics data for sellers
 * Bu route satıcılar üçün analitika məlumatları təmin edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/analytics
 * Get analytics data for seller / Satıcı üçün analitika məlumatlarını al
 * Query params: startDate, endDate (ISO date strings)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated / İstifadəçinin giriş edib-edmədiyini yoxla
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    // Get actual seller ID (handles User Seller case) / Faktiki seller ID-ni al (User Seller halını idarə edir)
    const { actualSellerId } = await getActualSellerId(session.user.id);

    // Get date range from query params / Query parametrlərindən tarix aralığını al
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Default to last 30 days if not provided / Təmin edilməyibsə, son 30 günü default et
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(new Date().setDate(endDate.getDate() - 30));

    // Set time to start/end of day / Günün başlanğıcı/bitməsi üçün vaxtı təyin et
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Calculate previous period for growth comparison / Artım müqayisəsi üçün əvvəlki dövrü hesabla
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    const previousEndDate = new Date(startDate);

    // Build where clause for current period / Cari dövr üçün where şərtini qur
    const whereClause = {
      sellerId: actualSellerId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Build where clause for previous period / Əvvəlki dövr üçün where şərtini qur
    const previousWhereClause = {
      sellerId: actualSellerId,
      createdAt: {
        gte: previousStartDate,
        lte: previousEndDate,
      },
    };

    let totalRevenue, totalOrders, totalCustomers, totalProducts;
    let previousRevenue, previousOrders, previousCustomers, previousProducts;
    let monthlyRevenue, topProducts, ordersByStatus;

    try {
      // Execute all independent queries in parallel / Bütün müstəqil query-ləri paralel icra et
      const [
        revenueResult,
        previousRevenueResult,
        totalOrdersResult,
        previousOrdersResult,
        customersResult,
        previousCustomersResult,
        totalProductsResult,
        ordersByMonth,
        topProductsData,
        ordersByStatusData,
      ] = await Promise.all([
        // Get total revenue (from delivered orders) / Ümumi gəliri al (çatdırılmış sifarişlərdən)
        db.order.aggregate({
          where: {
            ...whereClause,
            status: OrderStatus.DELIVERED,
          },
          _sum: {
            totalAmount: true,
          },
        }),
        // Get previous period revenue / Əvvəlki dövr gəlirini al
        db.order.aggregate({
          where: {
            ...previousWhereClause,
            status: OrderStatus.DELIVERED,
          },
          _sum: {
            totalAmount: true,
          },
        }),
        // Get total orders / Ümumi sifarişləri al
        db.order.count({
          where: whereClause,
        }),
        // Get previous period orders / Əvvəlki dövr sifarişləri
        db.order.count({
          where: previousWhereClause,
        }),
        // Get unique customers / Unikal müştəriləri al
        db.order.findMany({
          where: whereClause,
          select: {
            customerId: true,
          },
          distinct: ['customerId'],
        }),
        // Get previous period customers / Əvvəlki dövr müştəriləri
        db.order.findMany({
          where: previousWhereClause,
          select: {
            customerId: true,
          },
          distinct: ['customerId'],
        }),
        // Get total products / Ümumi məhsulları al
        db.product.count({
          where: {
            sellerId: actualSellerId,
            isActive: true,
          },
        }),
        // Get monthly revenue breakdown / Aylıq gəlir bölgüsünü al
        db.order.findMany({
          where: {
            ...whereClause,
            status: OrderStatus.DELIVERED,
          },
          select: {
            totalAmount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
        // Get top products by sales / Satışa görə ən yaxşı məhsulları al
        db.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              ...whereClause,
              status: OrderStatus.DELIVERED,
            },
          },
          _sum: {
            quantity: true,
            price: true,
          },
          _count: {
            id: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
          take: 10,
        }),
        // Get orders by status / Statusa görə sifarişləri al
        db.order.groupBy({
          by: ['status'],
          where: whereClause,
          _count: {
            id: true,
          },
        }),
      ]);

      // Process results / Nəticələri işlə
      totalRevenue = revenueResult._sum.totalAmount || 0;
      previousRevenue = previousRevenueResult._sum.totalAmount || 0;
      totalOrders = totalOrdersResult;
      previousOrders = previousOrdersResult;
      totalCustomers = customersResult.length;
      previousCustomers = previousCustomersResult.length;
      totalProducts = totalProductsResult;
      previousProducts = totalProductsResult; // Products don't change period to period usually

      // Group orders by month / Sifarişləri aya görə qruplaşdır
      const monthlyRevenueMap = new Map<string, number>();
      ordersByMonth.forEach(order => {
        const monthKey = order.createdAt.toISOString().substring(0, 7); // YYYY-MM format
        const current = monthlyRevenueMap.get(monthKey) || 0;
        monthlyRevenueMap.set(monthKey, current + Number(order.totalAmount));
      });

      monthlyRevenue = Array.from(monthlyRevenueMap.entries())
        .map(([month, revenue]) => ({
          month,
          revenue: Number(revenue),
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Get product names / Məhsul adlarını al
      topProducts = await Promise.all(
        topProductsData.map(async (item) => {
          const product = await db.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          return {
            id: item.productId,
            name: product?.name || 'Unknown Product / Naməlum Məhsul',
            sales: item._sum.quantity || 0,
            revenue: Number(item._sum.price || 0) * (item._sum.quantity || 0),
            orderCount: item._count.id,
          };
        })
      );

      ordersByStatus = ordersByStatusData.map(item => ({
        status: item.status,
        count: item._count.id,
      }));

    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET analytics');
      if (errorResponse) return errorResponse;

      // Retry all queries after reconnect / Yenidən bağlandıqdan sonra bütün query-ləri yenidən cəhd et
      const [
        revenueResult,
        previousRevenueResult,
        totalOrdersResult,
        previousOrdersResult,
        customersResult,
        previousCustomersResult,
        totalProductsResult,
        ordersByMonth,
        topProductsData,
        ordersByStatusData,
      ] = await Promise.all([
        db.order.aggregate({
          where: { ...whereClause, status: OrderStatus.DELIVERED },
          _sum: { totalAmount: true },
        }),
        db.order.aggregate({
          where: { ...previousWhereClause, status: OrderStatus.DELIVERED },
          _sum: { totalAmount: true },
        }),
        db.order.count({ where: whereClause }),
        db.order.count({ where: previousWhereClause }),
        db.order.findMany({
          where: whereClause,
          select: { customerId: true },
          distinct: ['customerId'],
        }),
        db.order.findMany({
          where: previousWhereClause,
          select: { customerId: true },
          distinct: ['customerId'],
        }),
        db.product.count({
          where: { sellerId: actualSellerId, isActive: true },
        }),
        db.order.findMany({
          where: { ...whereClause, status: OrderStatus.DELIVERED },
          select: { totalAmount: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        db.orderItem.groupBy({
          by: ['productId'],
          where: { order: { ...whereClause, status: OrderStatus.DELIVERED } },
          _sum: { quantity: true, price: true },
          _count: { id: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10,
        }),
        db.order.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { id: true },
        }),
      ]);

      // Process results / Nəticələri işlə
      totalRevenue = revenueResult._sum.totalAmount || 0;
      previousRevenue = previousRevenueResult._sum.totalAmount || 0;
      totalOrders = totalOrdersResult;
      previousOrders = previousOrdersResult;
      totalCustomers = customersResult.length;
      previousCustomers = previousCustomersResult.length;
      totalProducts = totalProductsResult;
      previousProducts = totalProductsResult;

      const monthlyRevenueMap = new Map<string, number>();
      ordersByMonth.forEach(order => {
        const monthKey = order.createdAt.toISOString().substring(0, 7);
        const current = monthlyRevenueMap.get(monthKey) || 0;
        monthlyRevenueMap.set(monthKey, current + Number(order.totalAmount));
      });

      monthlyRevenue = Array.from(monthlyRevenueMap.entries())
        .map(([month, revenue]) => ({ month, revenue: Number(revenue) }))
        .sort((a, b) => a.month.localeCompare(b.month));

      topProducts = await Promise.all(
        topProductsData.map(async (item) => {
          const product = await db.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          return {
            id: item.productId,
            name: product?.name || 'Unknown Product / Naməlum Məhsul',
            sales: item._sum.quantity || 0,
            revenue: Number(item._sum.price || 0) * (item._sum.quantity || 0),
            orderCount: item._count.id,
          };
        })
      );

      ordersByStatus = ordersByStatusData.map(item => ({
        status: item.status,
        count: item._count.id,
      }));
    }

    // Calculate growth percentages / Artım faizlərini hesabla
    const revenueGrowth = previousRevenue > 0 
      ? ((Number(totalRevenue) - Number(previousRevenue)) / Number(previousRevenue)) * 100 
      : 0;
    
    const ordersGrowth = previousOrders > 0 
      ? ((totalOrders - previousOrders) / previousOrders) * 100 
      : 0;
    
    const customersGrowth = previousCustomers > 0 
      ? ((totalCustomers - previousCustomers) / previousCustomers) * 100 
      : 0;
    
    const productsGrowth = previousProducts > 0 
      ? ((totalProducts - previousProducts) / previousProducts) * 100 
      : 0;

    return NextResponse.json({
      totalRevenue: Number(totalRevenue),
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueGrowth: Number(revenueGrowth.toFixed(2)),
      ordersGrowth: Number(ordersGrowth.toFixed(2)),
      customersGrowth: Number(customersGrowth.toFixed(2)),
      productsGrowth: Number(productsGrowth.toFixed(2)),
      monthlyRevenue,
      topProducts,
      ordersByStatus,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

  } catch (error: any) {
    console.error("Error fetching analytics / Analitika məlumatlarını əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

