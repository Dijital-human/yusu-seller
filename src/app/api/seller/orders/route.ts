import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// GET /api/seller/orders - Get seller's orders / Satıcının sifarişlərini al
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let currentUserId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      let testSeller;
      try {
        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET test seller for orders');
        if (errorResponse) return errorResponse;

        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      }
      
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    // Build where clause / Where şərtini qur
    const whereClause: any = {
      sellerId: actualSellerId,
    };

    // Add status filter if provided / Status filtrini əlavə et
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      whereClause.status = status;
    }

    // Add search filter if provided / Axtarış filtrini əlavə et
    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get orders with pagination and error handling
    // Xəta idarəetməsi ilə sifarişləri pagination ilə al
    let orders, totalCount;
    try {
      [orders, totalCount] = await Promise.all([
        db.order.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
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
            createdAt: "desc",
          },
        }),
        db.order.count({
          where: whereClause,
        }),
      ]);
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET orders');
      if (errorResponse) return errorResponse;

      [orders, totalCount] = await Promise.all([
        db.order.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
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
            createdAt: "desc",
          },
        }),
        db.order.count({
          where: whereClause,
        }),
      ]);
    }

    // Format orders for response / Sifarişləri cavab üçün formatla
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      customer: order.customer,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: item.product,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching seller orders / Satıcı sifarişlərini əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}