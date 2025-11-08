/**
 * Customer Orders API Route / Müştəri Sifarişləri API Route-u
 * This route handles customer order history for sellers
 * Bu route satıcılar üçün müştəri sifariş tarixçəsini idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/customers/[id]/orders
 * Get customer order history / Müştəri sifariş tarixçəsini al
 * Query params: page, limit
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

    // Get query parameters / Query parametrlərini al
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let orders, total;

    try {
      // Get orders for this customer / Bu müştəri üçün sifarişləri al
      [orders, total] = await Promise.all([
        db.order.findMany({
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
                    images: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        db.order.count({
          where: {
            sellerId: actualSellerId,
            customerId: customerId,
          },
        }),
      ]);
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET customer orders');
      if (errorResponse) return errorResponse;

      [orders, total] = await Promise.all([
        db.order.findMany({
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
                    images: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        db.order.count({
          where: {
            sellerId: actualSellerId,
            customerId: customerId,
          },
        }),
      ]);
    }

    // Format orders / Sifarişləri formatla
    const formattedOrders = orders.map(order => ({
      id: order.id,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          images: item.product.images,
        },
        quantity: item.quantity,
      })),
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    console.error("Error fetching customer orders / Müştəri sifarişlərini əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

