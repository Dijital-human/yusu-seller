/**
 * Auto Reorder Suggestions API Route / Avtomatik Yenidən Sifariş Tövsiyələri API Route-u
 * GET /api/seller/inventory/reorder-suggestions - Get reorder suggestions based on sales velocity and stock levels
 * GET /api/seller/inventory/reorder-suggestions - Satış sürəti və stok səviyyələrinə əsasən yenidən sifariş tövsiyələrini al
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";

interface ReorderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  daysUntilOutOfStock: number;
  suggestedReorderQuantity: number;
  reorderPoint: number;
  urgency: "low" | "medium" | "high" | "critical";
}

/**
 * Calculate average daily sales for a product based on order history
 * Sifariş tarixçəsinə əsasən məhsul üçün orta günlük satışı hesabla
 */
async function calculateAverageDailySales(productId: string, days: number = 30): Promise<number> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orderItems = await db.orderItem.findMany({
      where: {
        productId: productId,
        order: {
          status: {
            in: ["DELIVERED", "SHIPPED", "CONFIRMED"],
          },
          createdAt: {
            gte: startDate,
          },
        },
      },
      select: {
        quantity: true,
        order: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    if (orderItems.length === 0) {
      return 0;
    }

    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    return totalQuantity / days;
  } catch (error) {
    console.error("Error calculating average daily sales:", error);
    return 0;
  }
}

/**
 * Calculate reorder point based on average daily sales and lead time
 * Orta günlük satışa və tədarük müddətinə əsasən yenidən sifariş nöqtəsini hesabla
 */
function calculateReorderPoint(averageDailySales: number, leadTimeDays: number = 7, safetyStock: number = 10): number {
  return Math.ceil(averageDailySales * leadTimeDays + safetyStock);
}

/**
 * Calculate suggested reorder quantity
 * Tövsiyə olunan yenidən sifariş miqdarını hesabla
 */
function calculateSuggestedReorderQuantity(
  currentStock: number,
  reorderPoint: number,
  averageDailySales: number
): number {
  // Order enough to reach 2x reorder point / Yenidən sifariş nöqtəsinin 2 qatına çatmaq üçün kifayət qədər sifariş ver
  const targetStock = reorderPoint * 2;
  const needed = Math.max(0, targetStock - currentStock);
  
  // Round up to nearest 10 for practical ordering / Praktik sifariş üçün 10-a yuvarlaqlaşdır
  return Math.ceil(needed / 10) * 10;
}

/**
 * Determine urgency level based on days until out of stock
 * Stokun bitməsinə qalan günlərə əsasən təciliyyət səviyyəsini müəyyən et
 */
function getUrgencyLevel(daysUntilOutOfStock: number): "low" | "medium" | "high" | "critical" {
  if (daysUntilOutOfStock <= 0) return "critical";
  if (daysUntilOutOfStock <= 3) return "high";
  if (daysUntilOutOfStock <= 7) return "medium";
  return "low";
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    // Get actual seller ID / Faktiki satıcı ID-sini al
    const { actualSellerId } = await getActualSellerId(session.user.id);

    const { searchParams } = new URL(request.url);
    const urgency = searchParams.get("urgency") as "low" | "medium" | "high" | "critical" | null;
    const minDaysUntilOutOfStock = searchParams.get("minDays") ? parseInt(searchParams.get("minDays")!) : null;

    // Get all active products for the seller / Satıcının bütün aktiv məhsullarını al
    let products;
    try {
      products = await db.product.findMany({
        where: {
          sellerId: actualSellerId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          stock: true,
          sku: true,
        },
        orderBy: {
          stock: "asc", // Order by stock ascending to prioritize low stock items / Aşağı stoklu məhsulları prioritetləşdirmək üçün stoka görə artan sırada sırala
        },
      });
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        products = await db.product.findMany({
          where: {
            sellerId: actualSellerId,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            stock: true,
            sku: true,
          },
          orderBy: {
            stock: "asc",
          },
        });
      } else {
        throw error;
      }
    }

    const suggestions: ReorderSuggestion[] = [];

    // Calculate suggestions for each product / Hər məhsul üçün tövsiyələri hesabla
    for (const product of products) {
      const averageDailySales = await calculateAverageDailySales(product.id);
      
      // Skip products with no sales history / Satış tarixçəsi olmayan məhsulları atla
      if (averageDailySales === 0) {
        continue;
      }

      const reorderPoint = calculateReorderPoint(averageDailySales);
      const daysUntilOutOfStock = product.stock > 0 
        ? Math.floor(product.stock / averageDailySales)
        : 0;
      const urgencyLevel = getUrgencyLevel(daysUntilOutOfStock);

      // Apply filters / Filtrləri tətbiq et
      if (urgency && urgencyLevel !== urgency) {
        continue;
      }

      if (minDaysUntilOutOfStock !== null && daysUntilOutOfStock > minDaysUntilOutOfStock) {
        continue;
      }

      // Only suggest if stock is below reorder point / Yalnız stok yenidən sifariş nöqtəsinin altındadırsa tövsiyə et
      if (product.stock < reorderPoint) {
        const suggestedReorderQuantity = calculateSuggestedReorderQuantity(
          product.stock,
          reorderPoint,
          averageDailySales
        );

        suggestions.push({
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          averageDailySales: Math.round(averageDailySales * 100) / 100, // Round to 2 decimal places / 2 onluq yerə yuvarlaqlaşdır
          daysUntilOutOfStock,
          suggestedReorderQuantity,
          reorderPoint,
          urgency: urgencyLevel,
        });
      }
    }

    // Sort by urgency (critical first) / Təciliyyətə görə sırala (kritik birinci)
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return NextResponse.json({
      suggestions,
      count: suggestions.length,
      summary: {
        critical: suggestions.filter(s => s.urgency === "critical").length,
        high: suggestions.filter(s => s.urgency === "high").length,
        medium: suggestions.filter(s => s.urgency === "medium").length,
        low: suggestions.filter(s => s.urgency === "low").length,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reorder suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

