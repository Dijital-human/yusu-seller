/**
 * Order Cancellation API Route / Sifariş Ləğv Etmə API Route-u
 * POST /api/seller/orders/[id]/cancel - Cancel an order and restore stock
 * POST /api/seller/orders/[id]/cancel - Sifarişi ləğv et və stoku bərpa et
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db as prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { isValidSellerTransition } from "@/lib/order-workflow";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Cancellation schema / Ləğv etmə sxemi
const cancelOrderSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { 
          error: "Unauthorized / Yetkisiz",
          errorAz: "Yetkisiz"
        },
        { status: 401 }
      );
    }

    // Get actual seller ID (for User Seller support) / Həqiqi seller ID-ni al (User Seller dəstəyi üçün)
    const { actualSellerId, isUserSeller } = await getActualSellerId(session.user.id);

    // Check permission for User Sellers / User Seller-lər üçün icazəni yoxla
    if (isUserSeller) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { sellerPermissions: true },
      });

      if (user?.sellerPermissions) {
        try {
          const permissions = JSON.parse(user.sellerPermissions);
          if (permissions.manageOrders !== true) {
            return NextResponse.json(
              { 
                error: "Permission denied. You need manageOrders permission. / İcazə rədd edildi. manageOrders icazəsinə ehtiyacınız var.",
                errorAz: "İcazə rədd edildi. manageOrders icazəsinə ehtiyacınız var."
              },
              { status: 403 }
            );
          }
        } catch (error) {
          console.error("Error parsing permissions:", error);
        }
      }
    }

    const { id: orderId } = await params;
    const body = await req.json();

    // Validate input / Girişi yoxla
    const validatedFields = cancelOrderSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedFields.error.errors 
        },
        { status: 400 }
      );
    }

    // Get order with items / Sifarişi elementlərlə al
    let existingOrder;
    try {
      existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  stock: true,
                },
              },
            },
          },
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST cancel order - get order');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  stock: true,
                },
              },
            },
          },
        },
      });
    }

    if (!existingOrder) {
      return NextResponse.json(
        { 
          error: "Order not found / Sifariş tapılmadı",
          errorAz: "Sifariş tapılmadı"
        },
        { status: 404 }
      );
    }

    if (existingOrder.sellerId !== actualSellerId) {
      return NextResponse.json(
        { 
          error: "Unauthorized / İcazə yoxdur",
          errorAz: "İcazə yoxdur"
        },
        { status: 403 }
      );
    }

    // Check if order can be cancelled / Sifarişin ləğv edilə biləcəyini yoxla
    if (!isValidSellerTransition(existingOrder.status, OrderStatus.CANCELLED)) {
      return NextResponse.json(
        { 
          error: `Order cannot be cancelled from ${existingOrder.status} status / Sifariş ${existingOrder.status} statusundan ləğv edilə bilməz`
        },
        { status: 400 }
      );
    }

    // Use transaction to cancel order, restore stock, and create status history
    // Sifarişi ləğv etmək, stoku bərpa etmək və status tarixçəsi yaratmaq üçün transaction istifadə et
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Restore stock for each item / Hər element üçün stoku bərpa et
      for (const item of existingOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity, // Restore stock / Stoku bərpa et
            },
          },
        });
      }

      // Update order status to CANCELLED / Sifariş statusunu CANCELLED-ə yenilə
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          notes: validatedFields.data.reason 
            ? `${existingOrder.notes || ""}\n[CANCELLED] Reason: ${validatedFields.data.reason}`
            : existingOrder.notes,
        },
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
          status: OrderStatus.CANCELLED,
          previousStatus: existingOrder.status,
          changedBy: session.user.id, // Use actual user ID, not sellerId / Həqiqi istifadəçi ID-sini istifadə et, sellerId deyil
          notes: validatedFields.data.reason || "Order cancelled by seller / Sifariş satıcı tərəfindən ləğv edildi",
        },
      });

      return order;
    });

    return NextResponse.json({
      message: "Order cancelled successfully and stock restored / Sifariş uğurla ləğv edildi və stok bərpa edildi",
      order: cancelledOrder,
    }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          errorAz: "Yoxlama xətası",
          details: error.errors.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        errorAz: "Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

