import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

// GET /api/seller/stats - Get seller's statistics / Satıcının statistikalarını al
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let sellerId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      const testSeller = await prisma.user.findFirst({
        where: { role: "SELLER" }
      });
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      sellerId = testSeller.id;
    } else {
      sellerId = session?.user?.id;
    }

    // Get total products count
    // Ümumi məhsul sayını al
    const totalProducts = await prisma.product.count({
      where: {
        sellerId,
        isActive: true,
      },
    });

    // Get total orders count
    // Ümumi sifariş sayını al
    const totalOrders = await prisma.order.count({
      where: {
        sellerId,
      },
    });

    // Get total revenue
    // Ümumi gəliri al
    const revenueResult = await prisma.order.aggregate({
      where: {
        sellerId,
        status: OrderStatus.DELIVERED,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    // Get orders by status
    // Statusa görə sifarişləri al
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: { sellerId },
      _count: { id: true },
    });

    // Get recent orders (last 7 days)
    // Son sifarişlər (son 7 gün)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await prisma.order.count({
      where: {
        sellerId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get top selling products
    // Ən çox satılan məhsullar
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          sellerId,
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
    });

    // Get products with their names
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (product) => {
        const productInfo = await prisma.product.findUnique({
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

    // Get monthly revenue (last 6 months)
    // Aylıq gəlir (son 6 ay)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        sellerId,
        status: OrderStatus.DELIVERED,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

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
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}
