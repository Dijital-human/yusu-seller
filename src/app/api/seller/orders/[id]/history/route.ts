/**
 * Order Status History API Route / Sifariş Status Tarixçəsi API Route-u
 * GET /api/seller/orders/[id]/history - Get order status history
 * GET /api/seller/orders/[id]/history - Sifariş status tarixçəsini al
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { getStatusLabel } from "@/lib/order-workflow";

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
      sellerId = session?.user?.id;
    }

    const { id: orderId } = await params;

    // Check if order exists and belongs to the seller
    // Sifarişin mövcudluğunu və satıcıya aid olduğunu yoxla
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        sellerId: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found / Sifariş tapılmadı" },
        { status: 404 }
      );
    }

    if (order.sellerId !== sellerId) {
      return NextResponse.json(
        { error: "Unauthorized to view this order / Bu sifarişə baxmaq üçün icazəniz yoxdur" },
        { status: 403 }
      );
    }

    // Get status history / Status tarixçəsini al
    const statusHistory = await prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Format history entries / Tarixçə qeydlərini formatla
    const formattedHistory = statusHistory.map((entry) => ({
      id: entry.id,
      status: entry.status,
      statusLabel: getStatusLabel(entry.status),
      previousStatus: entry.previousStatus,
      previousStatusLabel: entry.previousStatus ? getStatusLabel(entry.previousStatus) : null,
      changedBy: entry.changedBy,
      notes: entry.notes,
      createdAt: entry.createdAt.toISOString(),
    }));

    return NextResponse.json({
      history: formattedHistory,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching order status history:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

