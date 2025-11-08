/**
 * User Seller Details API Route / İstifadəçi Satıcı Detalları API Route-u
 * This route handles fetching user seller details
 * Bu route istifadəçi satıcı detallarını əldə etməni idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/user-sellers/[id]
 * Get user seller details / İstifadəçi satıcı detallarını al
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const userId = params.id;
    const actualSellerId = await getActualSellerId(session.user.id);

    // Get user seller details / İstifadəçi satıcı detallarını al
    let userSeller;
    try {
      userSeller = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          sellerPermissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          superSellerId: true,
          role: true,
          sellerType: true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET user seller details');
      if (errorResponse) return errorResponse;

      userSeller = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          sellerPermissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          superSellerId: true,
          role: true,
          sellerType: true,
        },
      });
    }

    if (!userSeller) {
      return NextResponse.json(
        { error: "User seller not found / İstifadəçi satıcı tapılmadı" },
        { status: 404 }
      );
    }

    // Check authorization: only super seller can view their user sellers
    // İcazə yoxlaması: yalnız super seller öz user seller-lərini görə bilər
    if (userSeller.superSellerId !== actualSellerId && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden / Qadağan" },
        { status: 403 }
      );
    }

    // Parse permissions / İcazələri parse et
    let permissions = {};
    if (userSeller.sellerPermissions) {
      try {
        permissions = JSON.parse(userSeller.sellerPermissions);
      } catch (error) {
        console.error("Error parsing permissions:", error);
      }
    }

    // Get statistics / Statistika al
    // Get total orders / Ümumi sifarişlər
    let totalOrders = 0;
    try {
      totalOrders = await db.order.count({
        where: {
          sellerId: userId,
        },
      });
    } catch (error) {
      console.error("Error counting orders:", error);
    }

    // Get total products / Ümumi məhsullar
    let totalProducts = 0;
    try {
      totalProducts = await db.product.count({
        where: {
          sellerId: userId,
        },
      });
    } catch (error) {
      console.error("Error counting products:", error);
    }

    // Get total revenue / Ümumi gəlir
    let totalRevenue = 0;
    try {
      const orders = await db.order.findMany({
        where: {
          sellerId: userId,
          status: "COMPLETED",
        },
        select: {
          total: true,
        },
      });
      totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    } catch (error) {
      console.error("Error calculating revenue:", error);
    }

    return NextResponse.json({
      success: true,
      userSeller: {
        id: userSeller.id,
        name: userSeller.name,
        email: userSeller.email,
        phone: userSeller.phone,
        avatar: userSeller.image,
        permissions,
        isActive: userSeller.isActive,
        createdAt: userSeller.createdAt,
        updatedAt: userSeller.updatedAt,
      },
      statistics: {
        totalOrders,
        totalProducts,
        totalRevenue,
      },
    });

  } catch (error: any) {
    console.error("Error fetching user seller details / İstifadəçi satıcı detallarını əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

