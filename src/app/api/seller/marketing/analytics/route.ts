/**
 * Marketing Analytics API Route / Marketinq Analitikası API Route-u
 * This route provides marketing campaign performance metrics
 * Bu route marketinq kampaniya performans metrikalarını təmin edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/marketing/analytics
 * Get marketing analytics / Marketinq analitikasını al
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

    let discountCodes, flashSales, promotions, orders;

    try {
      // Get discount codes stats / Endirim kodları statistikalarını al
      discountCodes = await db.discountCode.findMany({
        where: {
          sellerId: actualSellerId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          code: true,
          usedCount: true,
          usageLimit: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Get flash sales stats / Flash sale statistikalarını al
      flashSales = await db.flashSale.findMany({
        where: {
          sellerId: actualSellerId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      });

      // Get promotions stats / Promosiyalar statistikalarını al
      promotions = await db.promotion.findMany({
        where: {
          sellerId: actualSellerId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Get orders that might have used marketing campaigns / Marketinq kampaniyalarından istifadə edən sifarişləri al
      // Note: This is a simplified version. In a real system, you'd track which campaigns were used in orders
      // Qeyd: Bu sadələşdirilmiş versiyadır. Real sistemdə hansı kampaniyaların sifarişlərdə istifadə edildiyini izləyərdiniz
      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
        },
      });

    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET marketing analytics');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      discountCodes = await db.discountCode.findMany({
        where: {
          sellerId: actualSellerId,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          code: true,
          usedCount: true,
          usageLimit: true,
          isActive: true,
          createdAt: true,
        },
      });

      flashSales = await db.flashSale.findMany({
        where: {
          sellerId: actualSellerId,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      });

      promotions = await db.promotion.findMany({
        where: {
          sellerId: actualSellerId,
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
        },
      });
    }

    // Calculate metrics / Metrikaları hesabla
    const totalCampaigns = discountCodes.length + flashSales.length + promotions.length;
    const activeCampaigns = 
      discountCodes.filter(c => c.isActive).length +
      flashSales.filter(s => s.isActive).length +
      promotions.filter(p => p.isActive).length;

    // Calculate total revenue from orders (simplified - assumes all orders in period are from marketing)
    // Sifarişlərdən ümumi gəliri hesabla (sadələşdirilmiş - dövrdəki bütün sifarişlərin marketinqdən olduğunu fərz edir)
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // Calculate discount codes usage / Endirim kodları istifadəsini hesabla
    const totalDiscountCodeUsage = discountCodes.reduce((sum, code) => sum + code.usedCount, 0);
    const discountCodeUsageRate = discountCodes.length > 0 
      ? (totalDiscountCodeUsage / discountCodes.reduce((sum, code) => sum + (code.usageLimit || 0), 0)) * 100 
      : 0;

    // Calculate flash sales performance / Flash sale performansını hesabla
    const activeFlashSales = flashSales.filter(s => s.isActive);
    const flashSalesRevenue = activeFlashSales.reduce((sum, sale) => {
      const discountAmount = Number(sale.product.price) * (Number(sale.discountPercentage) / 100);
      return sum + discountAmount;
    }, 0);

    // Calculate ROI (simplified - would need actual campaign spend tracking)
    // ROI hesabla (sadələşdirilmiş - faktiki kampaniya xərcləri izləməsi lazımdır)
    const estimatedSpend = totalCampaigns * 100; // Placeholder / Yer tutucu
    const roi = estimatedSpend > 0 ? ((totalRevenue - estimatedSpend) / estimatedSpend) * 100 : 0;

    // Calculate conversion rate (simplified)
    // Çevrilmə dərəcəsini hesabla (sadələşdirilmiş)
    const totalOrders = orders.length;
    const conversionRate = totalCampaigns > 0 ? (totalOrders / totalCampaigns) * 100 : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        totalCampaigns,
        activeCampaigns,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        estimatedSpend: Number(estimatedSpend.toFixed(2)),
        roi: Number(roi.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        discountCodeUsageRate: Number(discountCodeUsageRate.toFixed(2)),
        flashSalesRevenue: Number(flashSalesRevenue.toFixed(2)),
      },
      campaigns: {
        discountCodes: {
          total: discountCodes.length,
          active: discountCodes.filter(c => c.isActive).length,
          totalUsage: totalDiscountCodeUsage,
        },
        flashSales: {
          total: flashSales.length,
          active: flashSales.filter(s => s.isActive).length,
        },
        promotions: {
          total: promotions.length,
          active: promotions.filter(p => p.isActive).length,
        },
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

  } catch (error: any) {
    console.error("Error fetching marketing analytics / Marketinq analitikasını əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

