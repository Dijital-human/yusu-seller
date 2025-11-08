/**
 * Flash Sales API Route / Flash Sale API Route-u
 * This route handles flash sales CRUD operations for sellers
 * Bu route satıcılar üçün flash sale CRUD əməliyyatlarını idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { z } from "zod";
import { handleDatabaseError } from "@/lib/db-utils";

// Flash sale schema / Flash sale schema-sı
const flashSaleSchema = z.object({
  productId: z.string().min(1, "Product ID is required / Məhsul ID tələb olunur"),
  discountPercentage: z.number().min(0).max(100, "Discount percentage must be between 0 and 100 / Endirim faizi 0 ilə 100 arasında olmalıdır"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/seller/marketing/flash-sales
 * Get all flash sales for seller / Satıcı üçün bütün flash sale-ləri al
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const { actualSellerId } = await getActualSellerId(session.user.id);

    let flashSales;
    try {
      flashSales = await db.flashSale.findMany({
        where: {
          sellerId: actualSellerId,
        },
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET flash sales');
      if (errorResponse) return errorResponse;

      flashSales = await db.flashSale.findMany({
        where: {
          sellerId: actualSellerId,
        },
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return NextResponse.json({
      success: true,
      flashSales: flashSales.map(sale => ({
        ...sale,
        discountPercentage: Number(sale.discountPercentage),
      })),
    });

  } catch (error: any) {
    console.error("Error fetching flash sales / Flash sale-ləri əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seller/marketing/flash-sales
 * Create a new flash sale / Yeni flash sale yarat
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const { actualSellerId } = await getActualSellerId(session.user.id);
    const body = await request.json();

    // Validate flash sale data / Flash sale məlumatlarını yoxla
    const validatedData = flashSaleSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // Check if product exists and belongs to seller / Məhsulun mövcud olub satıcıya aid olub-olmadığını yoxla
    let product;
    try {
      product = await db.product.findFirst({
        where: {
          id: validatedData.data.productId,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'CHECK product for flash sale');
      if (errorResponse) return errorResponse;

      product = await db.product.findFirst({
        where: {
          id: validatedData.data.productId,
          sellerId: actualSellerId,
        },
      });
    }

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or does not belong to seller / Məhsul tapılmadı və ya satıcıya aid deyil" },
        { status: 404 }
      );
    }

    // Check if there's already an active flash sale for this product / Bu məhsul üçün artıq aktiv flash sale olub-olmadığını yoxla
    const startDate = new Date(validatedData.data.startDate);
    const endDate = new Date(validatedData.data.endDate);
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date / Bitmə tarixi başlanğıc tarixindən sonra olmalıdır" },
        { status: 400 }
      );
    }

    let existingSale;
    try {
      existingSale = await db.flashSale.findFirst({
        where: {
          productId: validatedData.data.productId,
          isActive: true,
          OR: [
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
              ],
            },
          ],
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'CHECK existing flash sale');
      if (errorResponse) return errorResponse;

      existingSale = await db.flashSale.findFirst({
        where: {
          productId: validatedData.data.productId,
          isActive: true,
          OR: [
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
              ],
            },
          ],
        },
      });
    }

    if (existingSale) {
      return NextResponse.json(
        { error: "An active flash sale already exists for this product in the specified date range / Bu məhsul üçün göstərilən tarix aralığında artıq aktiv flash sale mövcuddur" },
        { status: 400 }
      );
    }

    // Create flash sale / Flash sale yarat
    let flashSale;
    try {
      flashSale = await db.flashSale.create({
        data: {
          sellerId: actualSellerId,
          productId: validatedData.data.productId,
          discountPercentage: validatedData.data.discountPercentage,
          startDate: startDate,
          endDate: endDate,
          isActive: validatedData.data.isActive ?? true,
        },
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
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST flash sale');
      if (errorResponse) return errorResponse;

      flashSale = await db.flashSale.create({
        data: {
          sellerId: actualSellerId,
          productId: validatedData.data.productId,
          discountPercentage: validatedData.data.discountPercentage,
          startDate: startDate,
          endDate: endDate,
          isActive: validatedData.data.isActive ?? true,
        },
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
      });
    }

    return NextResponse.json({
      success: true,
      flashSale: {
        ...flashSale,
        discountPercentage: Number(flashSale.discountPercentage),
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating flash sale / Flash sale yaratma xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

