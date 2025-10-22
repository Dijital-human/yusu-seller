import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

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
      const testSeller = await prisma.user.findFirst({
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

    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
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

    if (!order) {
      return NextResponse.json({ message: "Order not found / Sifariş tapılmadı" }, { status: 404 });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized / İcazə yoxdur" }, { status: 401 });
    }

    if (order.sellerId !== session.user.id) {
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
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ message: "Internal server error / Daxili server xətası" }, { status: 500 });
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
      const testSeller = await prisma.user.findFirst({
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
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found / Sifariş tapılmadı" }, { status: 404 });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized / İcazə yoxdur" }, { status: 401 });
    }

    if (existingOrder.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to update this order / Bu sifarişi yeniləmək üçün icazəniz yoxdur" }, { status: 403 });
    }

    // Update order status
    // Sifariş statusunu yenilə
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: validatedFields.data.status,
        notes: validatedFields.data.notes,
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

    return NextResponse.json({
      message: "Order status updated successfully / Sifariş statusu uğurla yeniləndi",
      order: updatedOrder,
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Internal server error / Daxili server xətası" }, { status: 500 });
  }
}
