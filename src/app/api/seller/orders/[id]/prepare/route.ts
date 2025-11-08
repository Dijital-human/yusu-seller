import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== OrderStatus.PENDING) {
      return NextResponse.json(
        { error: "Order cannot be prepared" },
        { status: 400 }
      );
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: OrderStatus.PREPARING,
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
      message: "Order is now being prepared",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error preparing order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
