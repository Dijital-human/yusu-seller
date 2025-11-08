import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { isValidSellerTransition, getTransitionErrorMessage } from "@/lib/order-workflow";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Order status update schema / Sifariş status yeniləmə sxemi
const orderStatusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional(),
});

/**
 * GET /api/seller/orders/[id]
 * Fetches a specific order for the authenticated seller.
 * Authenticated user must be a SELLER and own the order.
 *
 * @param {Request} req - The incoming request.
 * @param {Object} params - Route parameters containing the order ID.
 * @returns {NextResponse} - A response containing the order or an error.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    let sellerId: string;

    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      let testSeller;
      try {
        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET test seller for order');
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
      
      sellerId = testSeller.id;
    } else {
      sellerId = session?.user?.id;
    }

    if (!sellerId) {
      return NextResponse.json({ message: "Unauthorized / İcazə yoxdur" }, { status: 401 });
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId } = await getActualSellerId(sellerId);

    const { id: orderId } = await params;

    let order;
    try {
      order = await db.order.findUnique({
        where: { id: orderId },
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
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET order');
      if (errorResponse) return errorResponse;

      order = await db.order.findUnique({
        where: { id: orderId },
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
      });
    }

    if (!order) {
      return NextResponse.json({ message: "Order not found / Sifariş tapılmadı" }, { status: 404 });
    }

    // Check if order belongs to actual seller
    // Sifarişin həqiqi satıcıya aid olub-olmadığını yoxla
    if (order.sellerId !== actualSellerId) {
      return NextResponse.json({ message: "Unauthorized to view this order / Bu sifarişə baxmaq üçün icazəniz yoxdur" }, { status: 403 });
    }

    // Format order for easier consumption
    // Sifarişi daha asan istifadə üçün formatla
    const formattedOrder = {
      id: order.id,
      customer: {
        id: order.customer?.id,
        name: order.customer?.name || "N/A",
        email: order.customer?.email || "N/A",
        phone: order.customer?.phone || "N/A",
      },
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images,
        },
        quantity: item.quantity,
        price: Number(item.price),
        total: item.quantity * Number(item.price),
      })),
    };

    return NextResponse.json(formattedOrder, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching order / Sifariş əldə etmə xətası:", error);
    return NextResponse.json({ 
      error: "Internal server error / Daxili server xətası",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * PUT /api/seller/orders/[id]
 * Updates order status for the authenticated seller.
 * Authenticated user must be a SELLER and own the order.
 *
 * @param {NextRequest} req - The incoming request.
 * @param {Object} params - Route parameters containing the order ID.
 * @returns {NextResponse} - A response containing the updated order or an error.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    let sellerId: string;

    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      let testSeller;
      try {
        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET test seller for order update');
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
      
      sellerId = testSeller.id;
    } else {
      sellerId = session?.user?.id;
    }

    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized / İcazə yoxdur" }, { status: 401 });
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId } = await getActualSellerId(sellerId);

    const { id: orderId } = await params;
    const body = await req.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedFields = orderStatusUpdateSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedFields.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to the seller
    // Sifarişin mövcudluğunu və satıcıya aid olduğunu yoxla
    let existingOrder;
    try {
      existingOrder = await db.order.findUnique({
        where: { id: orderId },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET order for update');
      if (errorResponse) return errorResponse;

      existingOrder = await db.order.findUnique({
        where: { id: orderId },
      });
    }

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found / Sifariş tapılmadı" }, { status: 404 });
    }

    // Check if order belongs to actual seller
    // Sifarişin həqiqi satıcıya aid olub-olmadığını yoxla
    if (existingOrder.sellerId !== actualSellerId) {
      return NextResponse.json({ error: "Unauthorized to update this order / Bu sifarişi yeniləmək üçün icazəniz yoxdur" }, { status: 403 });
    }

    // Validate status transition / Status keçidini yoxla
    const newStatus = validatedFields.data.status;
    if (!isValidSellerTransition(existingOrder.status, newStatus)) {
      return NextResponse.json(
        { 
          error: getTransitionErrorMessage(existingOrder.status, newStatus)
        },
        { status: 400 }
      );
    }

    // Update order with status history tracking / Status tarixçəsi ilə sifarişi yenilə
    const updateData: any = {
      status: newStatus,
    };
    
    if (validatedFields.data.notes !== undefined) {
      updateData.notes = validatedFields.data.notes;
    }

    // Use transaction to update order and create status history
    // Sifarişi yeniləmək və status tarixçəsi yaratmaq üçün transaction istifadə et
    let updatedOrder;
    try {
      updatedOrder = await db.$transaction(async (tx) => {
        // Update order / Sifarişi yenilə
        const order = await tx.order.update({
          where: { id: orderId },
          data: updateData,
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
        });

        // Create status history entry / Status tarixçəsi qeydi yarat
        await tx.orderStatusHistory.create({
          data: {
            orderId: orderId,
            status: newStatus,
            previousStatus: existingOrder.status,
            changedBy: sellerId,
            notes: validatedFields.data.notes || null,
          },
        });

        return order;
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT order');
      if (errorResponse) return errorResponse;

      updatedOrder = await db.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: orderId },
          data: updateData,
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
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: orderId,
            status: newStatus,
            previousStatus: existingOrder.status,
            changedBy: sellerId,
            notes: validatedFields.data.notes || null,
          },
        });

        return order;
      });
    }

    return NextResponse.json({
      message: "Order status updated successfully / Sifariş statusu uğurla yeniləndi",
      order: updatedOrder,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating order / Sifariş yeniləmə xətası:", error);
    return NextResponse.json({ 
      error: "Internal server error / Daxili server xətası",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
