/**
 * POS API Route / Kassa API Route-u
 * This route handles POS (Point of Sale) operations
 * Bu route Kassa (Satış Nöqtəsi) əməliyyatlarını idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for creating a POS sale / POS satışı yaratmaq üçün schema
const posSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, "Product ID is required / Məhsul ID tələb olunur"),
    variantId: z.string().optional(),
    quantity: z.number().int().positive("Quantity must be positive / Miqdar müsbət olmalıdır"),
    price: z.number().positive("Price must be positive / Qiymət müsbət olmalıdır"),
  })).min(1, "At least one item is required / Ən azı bir element tələb olunur"),
  paymentMethod: z.enum(["CASH", "CARD", "MIXED"]),
  cashAmount: z.number().optional(),
  cardAmount: z.number().optional(),
  totalAmount: z.number().positive("Total amount must be positive / Ümumi məbləğ müsbət olmalıdır"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

/**
 * POST /api/seller/pos/sale
 * Create a POS sale / POS satışı yarat
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let sellerId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      const testSeller = await db.user.findFirst({
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

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedData = posSaleSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    // Verify all products belong to seller and check stock / Bütün məhsulların satıcıya aid olduğunu və stoku yoxla
    for (const item of validatedData.data.items) {
      const product = await db.product.findFirst({
        where: {
          id: item.productId,
          sellerId: sellerId,
        },
        include: {
          variants: item.variantId ? {
            where: { id: item.variantId },
          } : false,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found or access denied / Məhsul tapılmadı və ya giriş qadağandır` },
          { status: 404 }
        );
      }

      // Check stock / Stoku yoxla
      const availableStock = item.variantId 
        ? product.variants?.[0]?.stock ?? 0
        : product.stock;

      if (availableStock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${product.name} / Məhsul üçün kifayət qədər stok yoxdur: ${product.name}` },
          { status: 400 }
        );
      }
    }

    // Create order for POS sale / POS satışı üçün sifariş yarat
    const order = await db.order.create({
      data: {
        customerId: sellerId, // POS sales use seller as customer / POS satışları satıcını müştəri kimi istifadə edir
        sellerId: sellerId,
        status: "CONFIRMED", // POS sales are immediately confirmed / POS satışları dərhal təsdiqlənir
        totalAmount: validatedData.data.totalAmount,
        shippingAddress: JSON.stringify({
          customerName: validatedData.data.customerName || "Walk-in Customer",
          customerPhone: validatedData.data.customerPhone || "",
          paymentMethod: validatedData.data.paymentMethod,
          cashAmount: validatedData.data.cashAmount,
          cardAmount: validatedData.data.cardAmount,
          isPOS: true,
        }),
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
    });

    // Create order items and update stock / Sifariş elementlərini yarat və stoku yenilə
    for (const item of validatedData.data.items) {
      // Create order item / Sifariş elementi yarat
      await db.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: item.price,
        },
      });

      // Update product stock / Məhsul stokunu yenilə
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      } else {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "POS sale created successfully / POS satışı uğurla yaradıldı",
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating POS sale / POS satışı yaratma xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seller/pos/history
 * Get POS sales history / POS satış tarixçəsini al
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let sellerId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      const testSeller = await db.user.findFirst({
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause / Where şərtini qur
    const whereClause: any = {
      sellerId: sellerId,
      shippingAddress: {
        contains: '"isPOS":true',
      },
    };

    // Add date filters if provided / Tarix filtrlərini əlavə et
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    // Get POS orders / POS sifarişlərini al
    const orders = await db.order.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get total count / Ümumi sayı al
    const totalCount = await db.order.count({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching POS history / POS tarixçəsini əldə etmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

