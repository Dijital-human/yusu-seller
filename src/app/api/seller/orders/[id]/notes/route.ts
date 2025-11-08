/**
 * Order Notes API Route / Sifariş Qeydləri API Route-u
 * GET /api/seller/orders/[id]/notes - Get order notes
 * POST /api/seller/orders/[id]/notes - Add order note
 * GET /api/seller/orders/[id]/notes - Sifariş qeydlərini al
 * POST /api/seller/orders/[id]/notes - Sifariş qeydi əlavə et
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db as prisma } from "@/lib/db";
import { z } from "zod";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Note schema / Qeyd sxemi
const noteSchema = z.object({
  note: z.string().min(1, "Note cannot be empty / Qeyd boş ola bilməz"),
});

export async function GET(
  req: Request,
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

    // Check if order exists and belongs to the seller
    // Sifarişin mövcudluğunu və satıcıya aid olduğunu yoxla
    let order;
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          sellerId: true,
          notes: true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET order notes - get order');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          sellerId: true,
          notes: true,
        },
      });
    }

    if (!order) {
      return NextResponse.json(
        { 
          error: "Order not found / Sifariş tapılmadı",
          errorAz: "Sifariş tapılmadı"
        },
        { status: 404 }
      );
    }

    if (order.sellerId !== actualSellerId) {
      return NextResponse.json(
        { 
          error: "Unauthorized / İcazə yoxdur",
          errorAz: "İcazə yoxdur"
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      notes: order.notes || "",
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching order notes:", error);
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
    const validatedFields = noteSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          errorAz: "Yoxlama xətası",
          details: validatedFields.error.errors.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to the seller
    // Sifarişin mövcudluğunu və satıcıya aid olduğunu yoxla
    let existingOrder;
    try {
      existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          sellerId: true,
          notes: true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST order notes - get order');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          sellerId: true,
          notes: true,
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

    // Append note to existing notes / Qeydi mövcud qeydlərə əlavə et
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${validatedFields.data.note}\n`;
    const updatedNotes = (existingOrder.notes || "") + newNote;

    // Update order notes / Sifariş qeydlərini yenilə
    let updatedOrder;
    try {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          notes: updatedNotes,
        },
        select: {
          id: true,
          notes: true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST order notes - update order');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          notes: updatedNotes,
        },
        select: {
          id: true,
          notes: true,
        },
      });
    }

    return NextResponse.json({
      message: "Note added successfully / Qeyd uğurla əlavə edildi",
      notes: updatedOrder.notes,
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
    console.error("Error adding order note:", error);
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

