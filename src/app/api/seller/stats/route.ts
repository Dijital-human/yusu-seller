import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// GET /api/seller/stats - Get seller's statistics / Satıcının statistikalarını al
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let currentUserId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      const testSeller = await db.user.findFirst({
        where: { role: "SELLER" }
      });
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session?.user?.id;
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId } = await getActualSellerId(currentUserId);

    // Prepare date ranges / Tarix aralıqlarını hazırla
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Execute all queries in parallel using Promise.all / Bütün query-ləri Promise.all ilə paralel icra et
    let totalProducts, totalOrders, revenueResult, ordersByStatus, recentOrders, topProducts, monthlyRevenue;
    
    try {
      [
        totalProducts,
        totalOrders,
        revenueResult,
        ordersByStatus,
        recentOrders,
        topProducts,
        monthlyRevenue,
      ] = await Promise.all([
        // Get total products count / Ümumi məhsul sayını al
        db.product.count({
          where: {
            sellerId: actualSellerId,
            isActive: true,
          },
        }),
        // Get total orders count / Ümumi sifariş sayını al
        db.order.count({
          where: {
            sellerId: actualSellerId,
          },
        }),
        // Get total revenue / Ümumi gəliri al
        db.order.aggregate({
          where: {
            sellerId: actualSellerId,
            status: OrderStatus.DELIVERED,
          },
          _sum: {
            totalAmount: true,
          },
        }),
        // Get orders by status / Statusa görə sifarişləri al
        db.order.groupBy({
          by: ['status'],
          where: { sellerId: actualSellerId },
          _count: { id: true },
        }),
        // Get recent orders (last 7 days) / Son sifarişlər (son 7 gün)
        db.order.count({
          where: {
            sellerId: actualSellerId,
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        }),
        // Get top selling products / Ən çox satılan məhsullar
        db.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              sellerId: actualSellerId,
              status: OrderStatus.DELIVERED,
            },
          },
          _sum: {
            quantity: true,
          },
          _count: {
            id: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
          take: 5,
        }),
        // Get monthly revenue (last 6 months) / Aylıq gəlir (son 6 ay)
        db.order.groupBy({
          by: ['createdAt'],
          where: {
            sellerId: actualSellerId,
            status: OrderStatus.DELIVERED,
            createdAt: {
              gte: sixMonthsAgo,
            },
          },
          _sum: {
            totalAmount: true,
          },
        }),
      ]);
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET seller stats');
      if (errorResponse) return errorResponse;
      
      // Retry all queries after reconnect / Yenidən bağlandıqdan sonra bütün query-ləri yenidən cəhd et
      [
        totalProducts,
        totalOrders,
        revenueResult,
        ordersByStatus,
        recentOrders,
        topProducts,
        monthlyRevenue,
      ] = await Promise.all([
        db.product.count({
          where: {
            sellerId: actualSellerId,
            isActive: true,
          },
        }),
        db.order.count({
          where: {
            sellerId: actualSellerId,
          },
        }),
        db.order.aggregate({
          where: {
            sellerId: actualSellerId,
            status: OrderStatus.DELIVERED,
          },
          _sum: {
            totalAmount: true,
          },
        }),
        db.order.groupBy({
          by: ['status'],
          where: { sellerId: actualSellerId },
          _count: { id: true },
        }),
        db.order.count({
          where: {
            sellerId: actualSellerId,
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        }),
        db.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              sellerId: actualSellerId,
              status: OrderStatus.DELIVERED,
            },
          },
          _sum: {
            quantity: true,
          },
          _count: {
            id: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
          take: 5,
        }),
        db.order.groupBy({
          by: ['createdAt'],
          where: {
            sellerId: actualSellerId,
            status: OrderStatus.DELIVERED,
            createdAt: {
              gte: sixMonthsAgo,
            },
          },
          _sum: {
            totalAmount: true,
          },
        }),
      ]);
    }

    // Get products with their names (depends on topProducts) / Məhsul adlarını al (topProducts-dən asılıdır)
    let topProductsWithNames;
    try {
      topProductsWithNames = await Promise.all(
        topProducts.map(async (product) => {
          const productInfo = await db.product.findUnique({
            where: { id: product.productId },
            select: { name: true, price: true },
          });
          return {
            productId: product.productId,
            productName: productInfo?.name || 'Unknown',
            totalSold: product._sum.quantity || 0,
            orderCount: product._count.id,
            price: productInfo?.price || 0,
          };
        })
      );
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET top products names');
      if (errorResponse) return errorResponse;
      
      // Retry / Yenidən cəhd et
      topProductsWithNames = await Promise.all(
        topProducts.map(async (product) => {
          const productInfo = await db.product.findUnique({
            where: { id: product.productId },
            select: { name: true, price: true },
          });
          return {
            productId: product.productId,
            productName: productInfo?.name || 'Unknown',
            totalSold: product._sum.quantity || 0,
            orderCount: product._count.id,
            price: productInfo?.price || 0,
          };
        })
      );
    }

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders: ordersByStatus.find(s => s.status === OrderStatus.PENDING)?._count.id || 0,
      ordersByStatus: ordersByStatus.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
      recentOrders,
      topProducts: topProductsWithNames,
      monthlyRevenue: monthlyRevenue.map(m => ({
        month: m.createdAt.toISOString().substring(0, 7),
        revenue: m._sum.totalAmount || 0,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching seller stats / Satıcı statistikalarını əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
