/**
 * Promotions API Route / Promosiyalar API Route-u
 * This route handles promotions CRUD operations for sellers
 * Bu route satıcılar üçün promosiyalar CRUD əməliyyatlarını idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { z } from "zod";
import { handleDatabaseError } from "@/lib/db-utils";

// Promotion schema / Promosiya schema-sı
const promotionSchema = z.object({
  name: z.string().min(1, "Name is required / Ad tələb olunur"),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y", "FREE_SHIPPING"], {
    errorMap: () => ({ message: "Type must be PERCENTAGE, FIXED_AMOUNT, BUY_X_GET_Y, or FREE_SHIPPING / Tip PERCENTAGE, FIXED_AMOUNT, BUY_X_GET_Y və ya FREE_SHIPPING olmalıdır" }),
  }),
  discountValue: z.number().nonnegative().optional().nullable(),
  minPurchase: z.number().nonnegative().optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/seller/marketing/promotions
 * Get all promotions for seller / Satıcı üçün bütün promosiyaları al
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

    let promotions;
    try {
      promotions = await db.promotion.findMany({
        where: {
          sellerId: actualSellerId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET promotions');
      if (errorResponse) return errorResponse;

      promotions = await db.promotion.findMany({
        where: {
          sellerId: actualSellerId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return NextResponse.json({
      success: true,
      promotions: promotions.map(promo => ({
        ...promo,
        discountValue: promo.discountValue ? Number(promo.discountValue) : null,
        minPurchase: promo.minPurchase ? Number(promo.minPurchase) : null,
      })),
    });

  } catch (error: any) {
    console.error("Error fetching promotions / Promosiyaları əldə etmə xətası:", error);
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
 * POST /api/seller/marketing/promotions
 * Create a new promotion / Yeni promosiya yarat
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

    // Validate promotion data / Promosiya məlumatlarını yoxla
    const validatedData = promotionSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // Validate date range / Tarix aralığını yoxla
    const startDate = new Date(validatedData.data.startDate);
    const endDate = new Date(validatedData.data.endDate);
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date / Bitmə tarixi başlanğıc tarixindən sonra olmalıdır" },
        { status: 400 }
      );
    }

    // Validate discount value based on type / Tipə əsasən endirim dəyərini yoxla
    if (validatedData.data.type === "PERCENTAGE" && validatedData.data.discountValue && validatedData.data.discountValue > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100% / Faiz endirimi 100%-dən çox ola bilməz" },
        { status: 400 }
      );
    }

    if ((validatedData.data.type === "PERCENTAGE" || validatedData.data.type === "FIXED_AMOUNT") && !validatedData.data.discountValue) {
      return NextResponse.json(
        { error: "Discount value is required for PERCENTAGE and FIXED_AMOUNT types / PERCENTAGE və FIXED_AMOUNT tipləri üçün endirim dəyəri tələb olunur" },
        { status: 400 }
      );
    }

    // Create promotion / Promosiya yarat
    let promotion;
    try {
      promotion = await db.promotion.create({
        data: {
          sellerId: actualSellerId,
          name: validatedData.data.name,
          description: validatedData.data.description,
          type: validatedData.data.type,
          discountValue: validatedData.data.discountValue,
          minPurchase: validatedData.data.minPurchase,
          startDate: startDate,
          endDate: endDate,
          isActive: validatedData.data.isActive ?? true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST promotion');
      if (errorResponse) return errorResponse;

      promotion = await db.promotion.create({
        data: {
          sellerId: actualSellerId,
          name: validatedData.data.name,
          description: validatedData.data.description,
          type: validatedData.data.type,
          discountValue: validatedData.data.discountValue,
          minPurchase: validatedData.data.minPurchase,
          startDate: startDate,
          endDate: endDate,
          isActive: validatedData.data.isActive ?? true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      promotion: {
        ...promotion,
        discountValue: promotion.discountValue ? Number(promotion.discountValue) : null,
        minPurchase: promotion.minPurchase ? Number(promotion.minPurchase) : null,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating promotion / Promosiya yaratma xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

