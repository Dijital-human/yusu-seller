/**
 * Revenue Optimization API Route / Gəlir Optimallaşdırması API Route-u
 * This route provides revenue optimization suggestions for sellers
 * Bu route satıcılar üçün gəlir optimallaşdırması təklifləri təmin edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/revenue/optimization
 * Get revenue optimization suggestions / Gəlir optimallaşdırması təkliflərini al
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

    let orders, products;

    try {
      // Get orders in period / Dövrdəki sifarişləri al
      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
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
                  name: true,
                  price: true,
                  purchasePrice: true,
                  stock: true,
                },
              },
            },
          },
        },
      });

      // Get all products / Bütün məhsulları al
      products = await db.product.findMany({
        where: {
          sellerId: actualSellerId,
        },
        include: {
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET revenue optimization');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  purchasePrice: true,
                  stock: true,
                },
              },
            },
          },
        },
      });

      products = await db.product.findMany({
        where: {
          sellerId: actualSellerId,
        },
        include: {
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });
    }

    // Generate optimization suggestions / Optimallaşdırması təklifləri yarat
    const suggestions: Array<{
      id: string;
      title: string;
      titleAz: string;
      description: string;
      descriptionAz: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
      impactAz: string;
      action: string;
      actionAz: string;
    }> = [];

    // Calculate metrics for suggestions / Təkliflər üçün metrikaları hesabla
    const totalRevenue = orders
      .filter(o => o.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    const averageOrderValue = orders.length > 0 
      ? orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / orders.length 
      : 0;

    const lowStockProducts = products.filter(p => p.stock < 10 && p.stock > 0);
    const outOfStockProducts = products.filter(p => p.stock === 0);
    const slowMovingProducts = products.filter(p => p._count.orderItems === 0);

    // Suggestion 1: Low stock products / Təklif 1: Aşağı stoklu məhsullar
    if (lowStockProducts.length > 0) {
      suggestions.push({
        id: 'low-stock',
        title: 'Restock Low Stock Products',
        titleAz: 'Aşağı Stoklu Məhsulları Yenilə',
        description: `You have ${lowStockProducts.length} products with low stock. Restocking these could prevent lost sales.`,
        descriptionAz: `${lowStockProducts.length} məhsulunuz aşağı stokdadır. Bunları yeniləmək satış itkisini qarşısını ala bilər.`,
        priority: 'high',
        impact: `Potential revenue increase: $${(lowStockProducts.length * averageOrderValue * 0.1).toFixed(2)}`,
        impactAz: `Potensial gəlir artımı: $${(lowStockProducts.length * averageOrderValue * 0.1).toFixed(2)}`,
        action: 'Review and restock low stock items',
        actionAz: 'Aşağı stoklu məhsulları nəzərdən keçirin və yeniləyin',
      });
    }

    // Suggestion 2: Out of stock products / Təklif 2: Stokda olmayan məhsullar
    if (outOfStockProducts.length > 0) {
      suggestions.push({
        id: 'out-of-stock',
        title: 'Restock Out of Stock Products',
        titleAz: 'Stokda Olmayan Məhsulları Yenilə',
        description: `You have ${outOfStockProducts.length} products out of stock. These are losing potential sales.`,
        descriptionAz: `${outOfStockProducts.length} məhsulunuz stokda yoxdur. Bunlar potensial satış itkisinə səbəb olur.`,
        priority: 'high',
        impact: `Potential revenue recovery: $${(outOfStockProducts.length * averageOrderValue * 0.2).toFixed(2)}`,
        impactAz: `Potensial gəlir bərpası: $${(outOfStockProducts.length * averageOrderValue * 0.2).toFixed(2)}`,
        action: 'Restock out of stock items immediately',
        actionAz: 'Stokda olmayan məhsulları dərhal yeniləyin',
      });
    }

    // Suggestion 3: Slow moving products / Təklif 3: Yavaş hərəkət edən məhsullar
    if (slowMovingProducts.length > 0) {
      suggestions.push({
        id: 'slow-moving',
        title: 'Promote Slow Moving Products',
        titleAz: 'Yavaş Hərəkət Edən Məhsulları Təşviq Et',
        description: `You have ${slowMovingProducts.length} products with no sales. Consider promotions or discounts.`,
        descriptionAz: `${slowMovingProducts.length} məhsulunuzun satışı yoxdur. Promosiyalar və ya endirimlər düşünün.`,
        priority: 'medium',
        impact: `Potential revenue increase: $${(slowMovingProducts.length * averageOrderValue * 0.05).toFixed(2)}`,
        impactAz: `Potensial gəlir artımı: $${(slowMovingProducts.length * averageOrderValue * 0.05).toFixed(2)}`,
        action: 'Create promotions for slow moving products',
        actionAz: 'Yavaş hərəkət edən məhsullar üçün promosiyalar yaradın',
      });
    }

    // Suggestion 4: Increase average order value / Təklif 4: Orta sifariş dəyərini artır
    if (averageOrderValue < 50) {
      suggestions.push({
        id: 'increase-aov',
        title: 'Increase Average Order Value',
        titleAz: 'Orta Sifariş Dəyərini Artır',
        description: 'Your average order value is below optimal. Consider upselling and cross-selling strategies.',
        descriptionAz: 'Orta sifariş dəyəriniz optimaldan aşağıdır. Upselling və cross-selling strategiyaları düşünün.',
        priority: 'medium',
        impact: `Potential revenue increase: $${(orders.length * 10).toFixed(2)}`,
        impactAz: `Potensial gəlir artımı: $${(orders.length * 10).toFixed(2)}`,
        action: 'Implement upselling and cross-selling',
        actionAz: 'Upselling və cross-selling tətbiq edin',
      });
    }

    // Suggestion 5: Optimize pricing / Təklif 5: Qiymətləndirməni optimallaşdır
    const highMarginProducts = products.filter(p => {
      const cost = p.purchasePrice ? Number(p.purchasePrice) : Number(p.price) * 0.7;
      const margin = ((Number(p.price) - cost) / Number(p.price)) * 100;
      return margin > 50;
    });

    if (highMarginProducts.length > 0) {
      suggestions.push({
        id: 'optimize-pricing',
        title: 'Optimize Product Pricing',
        titleAz: 'Məhsul Qiymətləndirməsini Optimallaşdır',
        description: `You have ${highMarginProducts.length} products with high profit margins. Consider competitive pricing.`,
        descriptionAz: `${highMarginProducts.length} məhsulunuz yüksək mənfəət marjasına malikdir. Rəqabətli qiymətləndirmə düşünün.`,
        priority: 'low',
        impact: `Potential sales increase: ${Math.round(highMarginProducts.length * 0.15)}%`,
        impactAz: `Potensial satış artımı: ${Math.round(highMarginProducts.length * 0.15)}%`,
        action: 'Review and adjust product pricing',
        actionAz: 'Məhsul qiymətləndirməsini nəzərdən keçirin və tənzimləyin',
      });
    }

    return NextResponse.json({
      success: true,
      suggestions,
    });

  } catch (error: any) {
    console.error("Error fetching revenue optimization / Gəlir optimallaşdırmasını əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

