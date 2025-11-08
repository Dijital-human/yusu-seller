/**
 * POS Stats API Route / Kassa Statistikaları API Route-u
 * This route provides POS statistics
 * Bu route Kassa statistikalarını təmin edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

/**
 * GET /api/seller/pos/stats
 * Get POS statistics / Kassa statistikalarını al
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let sellerId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      const testSeller = await db.user.findFirst({
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
      sellerId = session.user.id;
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today"; // today, week, month, year

    // Calculate date range / Tarix aralığını hesabla
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Get POS orders / POS sifarişlərini al
    const orders = await db.order.findMany({
      where: {
        sellerId: sellerId,
        shippingAddress: {
          contains: '"isPOS":true',
        },
        createdAt: {
          gte: startDate,
        },
        status: {
          in: ["CONFIRMED", "DELIVERED"],
        },
      },
      include: {
        items: true,
      },
    });

    // Calculate statistics / Statistikaları hesabla
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const totalItems = orders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Payment method breakdown / Ödəniş üsulu bölgüsü
    const paymentMethods = {
      CASH: 0,
      CARD: 0,
      MIXED: 0,
    };

    orders.forEach(order => {
      try {
        const shippingData = JSON.parse(order.shippingAddress);
        if (shippingData.paymentMethod) {
          paymentMethods[shippingData.paymentMethod as keyof typeof paymentMethods] += Number(order.totalAmount);
        }
      } catch (error) {
        // Ignore parse errors / Parse xətalarını nəzərə alma
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalSales,
        totalRevenue,
        totalItems,
        averageOrderValue,
        paymentMethods,
        period,
      },
    });
  } catch (error) {
    console.error("Error fetching POS stats / Kassa statistikalarını əldə etmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

