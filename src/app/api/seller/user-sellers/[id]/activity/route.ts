/**
 * User Seller Activity API Route / İstifadəçi Satıcı Hərəkətləri API Route-u
 * This route handles fetching user seller activity logs
 * Bu route istifadəçi satıcı hərəkət qeydlərini əldə etməni idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/user-sellers/[id]/activity
 * Get user seller activity logs / İstifadəçi satıcı hərəkət qeydlərini al
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

    // Get query parameters / Sorğu parametrlərini al
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type'); // 'order', 'product', 'warehouse', 'pos'

    // Verify user seller belongs to super seller
    // İstifadəçi satıcının super seller-ə aid olduğunu yoxla
    const userSeller = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        superSellerId: true,
      },
    });

    if (!userSeller) {
      return NextResponse.json(
        { error: "User seller not found / İstifadəçi satıcı tapılmadı" },
        { status: 404 }
      );
    }

    if (userSeller.superSellerId !== actualSellerId && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden / Qadağan" },
        { status: 403 }
      );
    }

    // Build activity logs from various sources
    // Müxtəlif mənbələrdən hərəkət qeydləri yarat
    const activities: any[] = [];

    // Get orders / Sifarişləri al
    if (!type || type === 'order') {
      try {
        const orders = await db.order.findMany({
          where: {
            sellerId: userId,
            ...(startDate && endDate ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            } : {}),
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        });

        orders.forEach(order => {
          activities.push({
            id: order.id,
            type: 'order',
            action: `Order ${order.orderNumber} - ${order.status}`,
            details: `Total: $${order.total?.toFixed(2) || '0.00'}`,
            date: order.createdAt,
          });
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    }

    // Get product operations / Məhsul əməliyyatlarını al
    if (!type || type === 'product') {
      try {
        const products = await db.product.findMany({
          where: {
            sellerId: userId,
            ...(startDate && endDate ? {
              updatedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            } : {}),
          },
          select: {
            id: true,
            name: true,
            isPublished: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 50,
        });

        products.forEach(product => {
          activities.push({
            id: product.id,
            type: 'product',
            action: product.isPublished ? 'Product published' : 'Product unpublished',
            details: product.name,
            date: product.updatedAt,
          });
        });
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }

    // Get warehouse operations / Anbar əməliyyatlarını al
    if (!type || type === 'warehouse') {
      try {
        const warehouseOps = await db.warehouseOperation.findMany({
          where: {
            userId: userId,
            ...(startDate && endDate ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            } : {}),
          },
          select: {
            id: true,
            type: true,
            quantity: true,
            createdAt: true,
            product: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        });

        warehouseOps.forEach(op => {
          activities.push({
            id: op.id,
            type: 'warehouse',
            action: `Warehouse ${op.type}`,
            details: `${op.product?.name || 'Product'} - Qty: ${op.quantity}`,
            date: op.createdAt,
          });
        });
      } catch (error) {
        console.error("Error fetching warehouse operations:", error);
      }
    }

    // Sort activities by date (newest first) / Hərəkətləri tarixə görə sırala (ən yeni əvvəl)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Limit to 100 most recent / Ən son 100-ə məhdudlaşdır
    const limitedActivities = activities.slice(0, 100);

    return NextResponse.json({
      success: true,
      activities: limitedActivities,
      total: activities.length,
    });

  } catch (error: any) {
    console.error("Error fetching user seller activity / İstifadəçi satıcı hərəkətlərini əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

