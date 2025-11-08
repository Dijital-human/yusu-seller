/**
 * Customer Details API Route / Müştəri Detalları API Route-u
 * This route handles customer details for sellers
 * Bu route satıcılar üçün müştəri detallarını idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * GET /api/seller/customers/[id]
 * Get customer details / Müştəri detallarını al
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

    let orders;

    try {
      // Get all orders for this customer from this seller / Bu müştəri üçün bu satıcıdan bütün sifarişləri al
      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
          customerId: customerId,
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET customer details');
      if (errorResponse) return errorResponse;

      orders = await db.order.findMany({
        where: {
          sellerId: actualSellerId,
          customerId: customerId,
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "Customer not found or no orders / Müştəri tapılmadı və ya sifariş yoxdur" },
        { status: 404 }
      );
    }

    // Calculate customer metrics / Müştəri metrikalarını hesabla
    const customer = orders[0].customer;
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const firstOrderDate = orders[orders.length - 1].createdAt;
    const lastOrderDate = orders[0].createdAt;

    // Get order status breakdown / Sifariş status bölgüsünü al
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top products / Ən çox satılan məhsulları al
    const productMap = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.id;
        const existing = productMap.get(productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += Number(item.product.price) * item.quantity;
        } else {
          productMap.set(productId, {
            id: productId,
            name: item.product.name,
            quantity: item.quantity,
            revenue: Number(item.product.price) * item.quantity,
          });
        }
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

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
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalOrders,
        totalSpent: Number(totalSpent.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        firstOrderDate: firstOrderDate.toISOString(),
        lastOrderDate: lastOrderDate.toISOString(),
        ordersByStatus,
        topProducts,
        orders: formattedOrders,
      },
    });

  } catch (error: any) {
    console.error("Error fetching customer details / Müştəri detallarını əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

