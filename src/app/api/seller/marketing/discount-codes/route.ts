/**
 * Discount Codes API Route / Endirim Kodları API Route-u
 * This route handles discount codes CRUD operations for sellers
 * Bu route satıcılar üçün endirim kodları CRUD əməliyyatlarını idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { z } from "zod";
import { handleDatabaseError } from "@/lib/db-utils";

// Discount code schema / Endirim kodu schema-sı
const discountCodeSchema = z.object({
  code: z.string().min(1, "Code is required / Kod tələb olunur"),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"], {
    errorMap: () => ({ message: "Discount type must be PERCENTAGE or FIXED_AMOUNT / Endirim tipi PERCENTAGE və ya FIXED_AMOUNT olmalıdır" }),
  }),
  discountValue: z.number().positive("Discount value must be positive / Endirim dəyəri müsbət olmalıdır"),
  minPurchase: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().optional(),
  usageLimit: z.number().int().positive().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/seller/marketing/discount-codes
 * Get all discount codes for seller / Satıcı üçün bütün endirim kodlarını al
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

    let discountCodes;
    try {
      discountCodes = await db.discountCode.findMany({
        where: {
          sellerId: actualSellerId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET discount codes');
      if (errorResponse) return errorResponse;

      discountCodes = await db.discountCode.findMany({
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
      discountCodes: discountCodes.map(code => ({
        ...code,
        discountValue: Number(code.discountValue),
        minPurchase: code.minPurchase ? Number(code.minPurchase) : null,
        maxDiscount: code.maxDiscount ? Number(code.maxDiscount) : null,
      })),
    });

  } catch (error: any) {
    console.error("Error fetching discount codes / Endirim kodlarını əldə etmə xətası:", error);
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
 * POST /api/seller/marketing/discount-codes
 * Create a new discount code / Yeni endirim kodu yarat
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

    // Validate discount code data / Endirim kodu məlumatlarını yoxla
    const validatedData = discountCodeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // Check if code already exists / Kodun artıq mövcud olub-olmadığını yoxla
    let existingCode;
    try {
      existingCode = await db.discountCode.findUnique({
        where: { code: validatedData.data.code },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'CHECK existing discount code');
      if (errorResponse) return errorResponse;

      existingCode = await db.discountCode.findUnique({
        where: { code: validatedData.data.code },
      });
    }

    if (existingCode) {
      return NextResponse.json(
        { error: "Discount code already exists / Endirim kodu artıq mövcuddur" },
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
    if (validatedData.data.discountType === "PERCENTAGE" && validatedData.data.discountValue > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100% / Faiz endirimi 100%-dən çox ola bilməz" },
        { status: 400 }
      );
    }

    // Create discount code / Endirim kodu yarat
    let discountCode;
    try {
      discountCode = await db.discountCode.create({
        data: {
          sellerId: actualSellerId,
          code: validatedData.data.code.toUpperCase(),
          discountType: validatedData.data.discountType,
          discountValue: validatedData.data.discountValue,
          minPurchase: validatedData.data.minPurchase,
          maxDiscount: validatedData.data.maxDiscount,
          usageLimit: validatedData.data.usageLimit,
          startDate: startDate,
          endDate: endDate,
          isActive: validatedData.data.isActive ?? true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST discount code');
      if (errorResponse) return errorResponse;

      discountCode = await db.discountCode.create({
        data: {
          sellerId: actualSellerId,
          code: validatedData.data.code.toUpperCase(),
          discountType: validatedData.data.discountType,
          discountValue: validatedData.data.discountValue,
          minPurchase: validatedData.data.minPurchase,
          maxDiscount: validatedData.data.maxDiscount,
          usageLimit: validatedData.data.usageLimit,
          startDate: startDate,
          endDate: endDate,
          isActive: validatedData.data.isActive ?? true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      discountCode: {
        ...discountCode,
        discountValue: Number(discountCode.discountValue),
        minPurchase: discountCode.minPurchase ? Number(discountCode.minPurchase) : null,
        maxDiscount: discountCode.maxDiscount ? Number(discountCode.maxDiscount) : null,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating discount code / Endirim kodu yaratma xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

