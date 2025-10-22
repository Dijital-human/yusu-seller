import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { courierId, notes } = await request.json();

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

    // Check if order can be handed to courier
    if (order.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Order must be confirmed first / Sifariş əvvəlcə təsdiqlənməlidir" },
        { status: 400 }
      );
    }

    // Find available courier
    let courier = null;
    if (courierId) {
      courier = await db.user.findUnique({
        where: { id: courierId, role: "COURIER" }
      });
    } else {
      // Find any available courier
      courier = await db.user.findFirst({
        where: { 
          role: "COURIER",
          isActive: true
        }
      });
    }

    if (!courier) {
      return NextResponse.json(
        { error: "No available courier / Mövcud kuryer yoxdur" },
        { status: 400 }
      );
    }

    // Update order status to SHIPPED
    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: "SHIPPED",
        courierId: courier.id,
        updatedAt: new Date()
      },
      include: {
        customer: true,
        seller: true,
        courier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Order handed to courier / Sifariş kuryer-ə verildi",
      order: updatedOrder,
      courier: {
        id: courier.id,
        name: courier.name,
        phone: courier.phone
      }
    });

  } catch (error) {
    console.error("Error handing order to courier:", error);
    return NextResponse.json(
      { error: "Internal server error / Server xətası" },
      { status: 500 }
    );
  }
}
