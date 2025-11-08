/**
 * Revenue API Route / Gəlir API Route-u
 * This route provides revenue analytics for sellers
 * Bu route satıcılar üçün gəlir analitikası təmin edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/revenue
 * Get revenue analytics for seller / Satıcı üçün gəlir analitikasını al
 * Query params: startDate, endDate (optional)
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

    let orders, previousOrders, products;

    try {
      // Execute all queries in parallel using Promise.all / Bütün query-ləri Promise.all ilə paralel icra et
      [orders, previousOrders, products] = await Promise.all([
        // Get delivered orders in current period / Cari dövrdə çatdırılmış sifarişləri al
        db.order.findMany({
          where: {
            sellerId: actualSellerId,
            status: OrderStatus.DELIVERED,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    price: true,
                    purchasePrice: true,
                  },
                },
              },
            },
          },
        }),
        // Get delivered orders in previous period / Əvvəlki dövrdə çatdırılmış sifarişləri al
        db.order.findMany({
          where: {
            sellerId: actualSellerId,
            status: OrderStatus.DELIVERED,
            createdAt: {
              gte: previousStartDate,
              lte: previousEndDate,
            },
          },
          select: {
            totalAmount: true,
          },
        }),
        // Get all products for profit calculation / Mənfəət hesablaması üçün bütün məhsulları al
        db.product.findMany({
          where: {
            sellerId: actualSellerId,
          },
          select: {
            id: true,
            price: true,
            purchasePrice: true,
          },
        }),
      ]);
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET revenue');
      if (errorResponse) return errorResponse;

      // Retry all queries after reconnect / Yenidən bağlandıqdan sonra bütün query-ləri yenidən cəhd et
      [orders, previousOrders, products] = await Promise.all([
        db.order.findMany({
          where: {
            sellerId: actualSellerId,
            status: OrderStatus.DELIVERED,
            createdAt: { gte: startDate, lte: endDate },
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    price: true,
                    purchasePrice: true,
                  },
                },
              },
            },
          },
        }),
        db.order.findMany({
          where: {
            sellerId: actualSellerId,
            status: OrderStatus.DELIVERED,
            createdAt: { gte: previousStartDate, lte: previousEndDate },
          },
          select: {
            totalAmount: true,
          },
        }),
        db.product.findMany({
          where: {
            sellerId: actualSellerId,
          },
          select: {
            id: true,
            price: true,
            purchasePrice: true,
          },
        }),
      ]);
    }

    // Calculate revenue metrics / Gəlir metrikalarını hesabla
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Calculate profit (revenue - cost) / Mənfəət hesabla (gəlir - xərc)
    const totalCost = orders.reduce((sum, order) => {
      const orderCost = order.items.reduce((itemSum, item) => {
        const product = item.product;
        const cost = product.purchasePrice ? Number(product.purchasePrice) : Number(product.price) * 0.7; // Default 70% if no purchase price
        return itemSum + (cost * item.quantity);
      }, 0);
      return sum + orderCost;
    }, 0);

    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Calculate average order value / Orta sifariş dəyərini hesabla
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Calculate daily revenue / Günlük gəliri hesabla
    const dailyRevenue = periodDays > 0 ? totalRevenue / periodDays : 0;

    // Calculate monthly revenue / Aylıq gəliri hesabla
    const monthlyRevenue = (totalRevenue / periodDays) * 30;

    // Calculate conversion rate (simplified - would need visitor tracking)
    // Çevrilmə dərəcəsini hesabla (sadələşdirilmiş - ziyarətçi izləməsi lazımdır)
    const conversionRate = 0; // Placeholder / Yer tutucu

    // Calculate customer lifetime value (simplified)
    // Müştəri ömür dəyərini hesabla (sadələşdirilmiş)
    const uniqueCustomers = new Set(orders.map(order => order.customerId)).size;
    const customerLifetimeValue = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

    // Calculate revenue breakdown / Gəlir bölgüsünü hesabla
    // Product Sales: All revenue from product orders / Məhsul Satışları: Məhsul sifarişlərindən bütün gəlir
    const productSales = totalRevenue; // All orders are product sales / Bütün sifarişlər məhsul satışıdır
    
    // Services: Currently 0 (no service orders) / Xidmətlər: Hazırda 0 (xidmət sifarişi yoxdur)
    const servicesRevenue = 0;
    
    // Subscriptions: Currently 0 (no subscription orders) / Abunəliklər: Hazırda 0 (abunəlik sifarişi yoxdur)
    const subscriptionsRevenue = 0;

    // Calculate percentages / Faizləri hesabla
    const productSalesPercentage = totalRevenue > 0 ? (productSales / totalRevenue) * 100 : 0;
    const servicesPercentage = totalRevenue > 0 ? (servicesRevenue / totalRevenue) * 100 : 0;
    const subscriptionsPercentage = totalRevenue > 0 ? (subscriptionsRevenue / totalRevenue) * 100 : 0;

    return NextResponse.json({
      success: true,
      revenue: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
        dailyRevenue: Number(dailyRevenue.toFixed(2)),
        revenueGrowth: Number(revenueGrowth.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        customerLifetimeValue: Number(customerLifetimeValue.toFixed(2)),
        profitMargin: Number(profitMargin.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        // Revenue breakdown / Gəlir bölgüsü
        breakdown: {
          productSales: {
            amount: Number(productSales.toFixed(2)),
            percentage: Number(productSalesPercentage.toFixed(2)),
          },
          services: {
            amount: Number(servicesRevenue.toFixed(2)),
            percentage: Number(servicesPercentage.toFixed(2)),
          },
          subscriptions: {
            amount: Number(subscriptionsRevenue.toFixed(2)),
            percentage: Number(subscriptionsPercentage.toFixed(2)),
          },
        },
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: periodDays,
      },
    });

  } catch (error: any) {
    console.error("Error fetching revenue / Gəliri əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

