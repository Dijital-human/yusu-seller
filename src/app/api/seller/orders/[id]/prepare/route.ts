import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the order
    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        seller: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found / Sifariş tapılmadı" },
        { status: 404 }
      );
    }

    // Check if order can be prepared
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order cannot be prepared / Sifariş hazırlana bilməz" },
        { status: 400 }
      );
    }

    // Update order status to PREPARING
    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: "PREPARING",
        updatedAt: new Date()
      },
      include: {
        customer: true,
        seller: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Order is now being prepared / Sifariş hazırlanır",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error preparing order:", error);
    return NextResponse.json(
      { error: "Internal server error / Server xətası" },
      { status: 500 }
    );
  }
}
