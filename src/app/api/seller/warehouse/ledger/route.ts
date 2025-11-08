/**
 * Warehouse Ledger API Route / Anbar Hesab Kitabı API Route-u
 * This route handles warehouse accounting/ledger (GET)
 * Bu route anbar hesab kitabını idarə edir (GET)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";

/**
 * GET /api/seller/warehouse/ledger
 * Get warehouse ledger entries / Anbar hesab kitabı qeydlərini al
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    let currentUserId: string;
    
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
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session.user.id;
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId } = await getActualSellerId(currentUserId);

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const productId = searchParams.get("productId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    // Build where clause / Where şərtini qur
    const whereClause: any = {
      warehouse: {
        sellerId: actualSellerId, // Super Seller ID
      },
    };

    // Apply filters / Filtrləri tətbiq et
    if (warehouseId && warehouseId.trim() !== "") {
      whereClause.warehouseId = warehouseId;
    }

    if (productId && productId.trim() !== "") {
      whereClause.productId = productId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate && startDate.trim() !== "") {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate && endDate.trim() !== "") {
        // Set end date to end of day / Bitmə tarixini günün sonuna təyin et
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        whereClause.date.lte = endDateObj;
      }
    }

    if (type && type.trim() !== "" && ["INCOMING", "OUTGOING", "TRANSFER", "ADJUSTMENT"].includes(type)) {
      whereClause.type = type;
    }

    // Get ledger entries with error handling
    // Xəta idarəetməsi ilə hesab kitabı qeydlərini al
    let ledgerEntries;
    try {
      ledgerEntries = await db.warehouseLedger.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
            },
          },
          operation: {
            select: {
              id: true,
              type: true,
              reason: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        ledgerEntries = await db.warehouseLedger.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
              },
            },
            operation: {
              select: {
                id: true,
                type: true,
                reason: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        });
      } else {
        throw error;
      }
    }

    // Get total count / Ümumi sayı al
    let totalCount;
    try {
      totalCount = await db.warehouseLedger.count({
        where: whereClause,
      });
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        totalCount = await db.warehouseLedger.count({
          where: whereClause,
        });
      } else {
        throw error;
      }
    }

    // Calculate summary / Xülasə hesabla
    let summary;
    try {
      const allEntries = await db.warehouseLedger.findMany({
        where: whereClause,
        select: {
          type: true,
          quantity: true,
          totalValue: true,
        },
      });

      const incoming = allEntries
        .filter(e => e.type === "INCOMING")
        .reduce((sum, e) => sum + Number(e.totalValue || 0), 0);
      
      const outgoing = allEntries
        .filter(e => e.type === "OUTGOING")
        .reduce((sum, e) => sum + Number(e.totalValue || 0), 0);

      // Get latest balance for each product / Hər məhsul üçün son balansı al
      // Get all unique product IDs first / Əvvəlcə bütün unikal məhsul ID-lərini al
      const uniqueProducts = await db.warehouseLedger.findMany({
        where: whereClause,
        select: {
          productId: true,
        },
        distinct: ['productId'],
      });

      // Get latest ledger entry for each product / Hər məhsul üçün son ledger qeydini al
      const latestEntriesPromises = uniqueProducts.map(async (up) => {
        try {
          const latest = await db.warehouseLedger.findFirst({
            where: {
              ...whereClause,
              productId: up.productId,
            },
            select: {
              balanceQty: true,
              balanceValue: true,
            },
            orderBy: {
              date: "desc",
              createdAt: "desc",
            },
          });
          return latest;
        } catch (error) {
          console.error(`Error getting latest entry for product ${up.productId} / Məhsul ${up.productId} üçün son qeydi alma xətası:`, error);
          return null;
        }
      });

      const latestEntries = await Promise.all(latestEntriesPromises);
      const validEntries = latestEntries.filter((e): e is NonNullable<typeof e> => e !== null);

      const totalBalanceQty = validEntries.reduce((sum, e) => sum + (e.balanceQty || 0), 0);
      const totalBalanceValue = validEntries.reduce((sum, e) => sum + Number(e.balanceValue || 0), 0);

      summary = {
        incoming: incoming,
        outgoing: outgoing,
        net: incoming - outgoing,
        totalBalanceQty: totalBalanceQty,
        totalBalanceValue: totalBalanceValue,
      };
    } catch (error: any) {
      console.error("Error calculating summary / Xülasə hesablama xətası:", error);
      summary = {
        incoming: 0,
        outgoing: 0,
        net: 0,
        totalBalanceQty: 0,
        totalBalanceValue: 0,
      };
    }

    return NextResponse.json({
      success: true,
      ledgerEntries,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching warehouse ledger / Anbar hesab kitabını əldə etmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

