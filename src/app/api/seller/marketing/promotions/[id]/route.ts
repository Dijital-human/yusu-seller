/**
 * Promotion by ID API Route / ID-yə görə Promosiya API Route-u
 * This route handles update and delete operations for a specific promotion
 * Bu route müəyyən promosiya üçün yeniləmə və silmə əməliyyatlarını idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { z } from "zod";
import { handleDatabaseError } from "@/lib/db-utils";

// Update promotion schema / Promosiya yeniləmə schema-sı
const updatePromotionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y", "FREE_SHIPPING"]).optional(),
  discountValue: z.number().nonnegative().optional().nullable(),
  minPurchase: z.number().nonnegative().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/seller/marketing/promotions/[id]
 * Update a promotion / Promosiyanı yenilə
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { id } = params;
    const body = await request.json();

    // Validate update data / Yeniləmə məlumatlarını yoxla
    const validatedData = updatePromotionSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // Check if promotion exists and belongs to seller / Promosiyanın mövcud olub satıcıya aid olub-olmadığını yoxla
    let promotion;
    try {
      promotion = await db.promotion.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET promotion for update');
      if (errorResponse) return errorResponse;

      promotion = await db.promotion.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    }

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found / Promosiya tapılmadı" },
        { status: 404 }
      );
    }

    // Validate date range if dates are being updated / Tarixlər yenilənirsə tarix aralığını yoxla
    const startDate = validatedData.data.startDate ? new Date(validatedData.data.startDate) : promotion.startDate;
    const endDate = validatedData.data.endDate ? new Date(validatedData.data.endDate) : promotion.endDate;
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date / Bitmə tarixi başlanğıc tarixindən sonra olmalıdır" },
        { status: 400 }
      );
    }

    // Validate discount value / Endirim dəyərini yoxla
    const type = validatedData.data.type || promotion.type;
    const discountValue = validatedData.data.discountValue !== undefined ? validatedData.data.discountValue : (promotion.discountValue ? Number(promotion.discountValue) : null);
    
    if (type === "PERCENTAGE" && discountValue && discountValue > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100% / Faiz endirimi 100%-dən çox ola bilməz" },
        { status: 400 }
      );
    }

    if ((type === "PERCENTAGE" || type === "FIXED_AMOUNT") && !discountValue) {
      return NextResponse.json(
        { error: "Discount value is required for PERCENTAGE and FIXED_AMOUNT types / PERCENTAGE və FIXED_AMOUNT tipləri üçün endirim dəyəri tələb olunur" },
        { status: 400 }
      );
    }

    // Prepare update data / Yeniləmə məlumatlarını hazırla
    const updateData: any = {};
    if (validatedData.data.name !== undefined) updateData.name = validatedData.data.name;
    if (validatedData.data.description !== undefined) updateData.description = validatedData.data.description;
    if (validatedData.data.type !== undefined) updateData.type = validatedData.data.type;
    if (validatedData.data.discountValue !== undefined) updateData.discountValue = validatedData.data.discountValue;
    if (validatedData.data.minPurchase !== undefined) updateData.minPurchase = validatedData.data.minPurchase;
    if (validatedData.data.startDate !== undefined) updateData.startDate = startDate;
    if (validatedData.data.endDate !== undefined) updateData.endDate = endDate;
    if (validatedData.data.isActive !== undefined) updateData.isActive = validatedData.data.isActive;

    // Update promotion / Promosiyanı yenilə
    let updatedPromotion;
    try {
      updatedPromotion = await db.promotion.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT promotion');
      if (errorResponse) return errorResponse;

      updatedPromotion = await db.promotion.update({
        where: { id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      promotion: {
        ...updatedPromotion,
        discountValue: updatedPromotion.discountValue ? Number(updatedPromotion.discountValue) : null,
        minPurchase: updatedPromotion.minPurchase ? Number(updatedPromotion.minPurchase) : null,
      },
    });

  } catch (error: any) {
    console.error("Error updating promotion / Promosiyanı yeniləmə xətası:", error);
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
 * DELETE /api/seller/marketing/promotions/[id]
 * Delete a promotion / Promosiyanı sil
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { id } = params;

    // Check if promotion exists and belongs to seller / Promosiyanın mövcud olub satıcıya aid olub-olmadığını yoxla
    let promotion;
    try {
      promotion = await db.promotion.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET promotion for delete');
      if (errorResponse) return errorResponse;

      promotion = await db.promotion.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    }

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found / Promosiya tapılmadı" },
        { status: 404 }
      );
    }

    // Delete promotion / Promosiyanı sil
    try {
      await db.promotion.delete({
        where: { id },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'DELETE promotion');
      if (errorResponse) return errorResponse;

      await db.promotion.delete({
        where: { id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Promotion deleted successfully / Promosiya uğurla silindi",
    });

  } catch (error: any) {
    console.error("Error deleting promotion / Promosiyanı silmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

