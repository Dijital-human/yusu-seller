/**
 * Customer Analytics API Route / Müştəri Analitikası API Route-u
 * This route provides customer analytics for sellers
 * Bu route satıcılar üçün müştəri analitikası təmin edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/customers/[id]/analytics
 * Get customer analytics / Müştəri analitikasını al
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const { actualSellerId } = await getActualSellerId(session.user.id);
    const { id: customerId } = await params;

    let orders;

    try {
      // Get all orders for this customer / Bu müştəri üçün bütün sifarişləri al
      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
          customerId: customerId,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  categoryId: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET customer analytics');
      if (errorResponse) return errorResponse;

      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
          customerId: customerId,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  categoryId: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "Customer not found or no orders / Müştəri tapılmadı və ya sifariş yoxdur" },
        { status: 404 }
      );
    }

    // Calculate analytics / Analitikanı hesabla
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const firstOrderDate = orders[orders.length - 1].createdAt;
    const lastOrderDate = orders[0].createdAt;
    const daysSinceFirstOrder = Math.ceil((new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastOrder = Math.ceil((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageDaysBetweenOrders = totalOrders > 1 
      ? daysSinceFirstOrder / (totalOrders - 1) 
      : 0;

    // Calculate monthly spending / Aylıq xərcləməni hesabla
    const monthlySpending = daysSinceFirstOrder > 0 
      ? (totalSpent / daysSinceFirstOrder) * 30 
      : 0;

    // Get order status breakdown / Sifariş status bölgüsünü al
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get category preferences / Kateqoriya üstünlüklərini al
    const categoryMap = new Map<string, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const categoryId = item.product.categoryId || 'unknown';
        categoryMap.set(categoryId, (categoryMap.get(categoryId) || 0) + item.quantity);
      });
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([categoryId, count]) => ({ categoryId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate customer lifetime value / Müştəri həyat dəyərini hesabla
    const customerLifetimeValue = totalSpent;

    // Calculate retention score (simplified) / Qorunma balı hesabla (sadələşdirilmiş)
    const retentionScore = daysSinceLastOrder < 30 ? 100 
      : daysSinceLastOrder < 60 ? 75 
      : daysSinceLastOrder < 90 ? 50 
      : daysSinceLastOrder < 180 ? 25 
      : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        totalOrders,
        totalSpent: Number(totalSpent.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        customerLifetimeValue: Number(customerLifetimeValue.toFixed(2)),
        monthlySpending: Number(monthlySpending.toFixed(2)),
        averageDaysBetweenOrders: Number(averageDaysBetweenOrders.toFixed(1)),
        daysSinceFirstOrder,
        daysSinceLastOrder,
        retentionScore,
        ordersByStatus,
        topCategories,
        firstOrderDate: firstOrderDate.toISOString(),
        lastOrderDate: lastOrderDate.toISOString(),
      },
    });

  } catch (error: any) {
    console.error("Error fetching customer analytics / Müştəri analitikasını əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

