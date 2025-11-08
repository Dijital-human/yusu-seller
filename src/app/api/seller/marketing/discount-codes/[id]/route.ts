/**
 * Discount Code by ID API Route / ID-yə görə Endirim Kodu API Route-u
 * This route handles update and delete operations for a specific discount code
 * Bu route müəyyən endirim kodu üçün yeniləmə və silmə əməliyyatlarını idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { z } from "zod";
import { handleDatabaseError } from "@/lib/db-utils";

// Update discount code schema / Endirim kodu yeniləmə schema-sı
const updateDiscountCodeSchema = z.object({
  code: z.string().min(1).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  discountValue: z.number().positive().optional(),
  minPurchase: z.number().nonnegative().optional().nullable(),
  maxDiscount: z.number().nonnegative().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/seller/marketing/discount-codes/[id]
 * Update a discount code / Endirim kodunu yenilə
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
    const validatedData = updateDiscountCodeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // Check if discount code exists and belongs to seller / Endirim kodunun mövcud olub satıcıya aid olub-olmadığını yoxla
    let discountCode;
    try {
      discountCode = await db.discountCode.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET discount code for update');
      if (errorResponse) return errorResponse;

      discountCode = await db.discountCode.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    }

    if (!discountCode) {
      return NextResponse.json(
        { error: "Discount code not found / Endirim kodu tapılmadı" },
        { status: 404 }
      );
    }

    // If code is being updated, check if new code already exists / Kod yenilənirsə, yeni kodun artıq mövcud olub-olmadığını yoxla
    if (validatedData.data.code && validatedData.data.code !== discountCode.code) {
      let existingCode;
      try {
        existingCode = await db.discountCode.findUnique({
          where: { code: validatedData.data.code.toUpperCase() },
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'CHECK existing code');
        if (errorResponse) return errorResponse;

        existingCode = await db.discountCode.findUnique({
          where: { code: validatedData.data.code.toUpperCase() },
        });
      }

      if (existingCode) {
        return NextResponse.json(
          { error: "Discount code already exists / Endirim kodu artıq mövcuddur" },
          { status: 400 }
        );
      }
    }

    // Validate date range if dates are being updated / Tarixlər yenilənirsə tarix aralığını yoxla
    const startDate = validatedData.data.startDate ? new Date(validatedData.data.startDate) : discountCode.startDate;
    const endDate = validatedData.data.endDate ? new Date(validatedData.data.endDate) : discountCode.endDate;
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date / Bitmə tarixi başlanğıc tarixindən sonra olmalıdır" },
        { status: 400 }
      );
    }

    // Validate discount value / Endirim dəyərini yoxla
    const discountType = validatedData.data.discountType || discountCode.discountType;
    const discountValue = validatedData.data.discountValue ?? Number(discountCode.discountValue);
    
    if (discountType === "PERCENTAGE" && discountValue > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100% / Faiz endirimi 100%-dən çox ola bilməz" },
        { status: 400 }
      );
    }

    // Prepare update data / Yeniləmə məlumatlarını hazırla
    const updateData: any = {};
    if (validatedData.data.code !== undefined) updateData.code = validatedData.data.code.toUpperCase();
    if (validatedData.data.discountType !== undefined) updateData.discountType = validatedData.data.discountType;
    if (validatedData.data.discountValue !== undefined) updateData.discountValue = validatedData.data.discountValue;
    if (validatedData.data.minPurchase !== undefined) updateData.minPurchase = validatedData.data.minPurchase;
    if (validatedData.data.maxDiscount !== undefined) updateData.maxDiscount = validatedData.data.maxDiscount;
    if (validatedData.data.usageLimit !== undefined) updateData.usageLimit = validatedData.data.usageLimit;
    if (validatedData.data.startDate !== undefined) updateData.startDate = startDate;
    if (validatedData.data.endDate !== undefined) updateData.endDate = endDate;
    if (validatedData.data.isActive !== undefined) updateData.isActive = validatedData.data.isActive;

    // Update discount code / Endirim kodunu yenilə
    let updatedCode;
    try {
      updatedCode = await db.discountCode.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT discount code');
      if (errorResponse) return errorResponse;

      updatedCode = await db.discountCode.update({
        where: { id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      discountCode: {
        ...updatedCode,
        discountValue: Number(updatedCode.discountValue),
        minPurchase: updatedCode.minPurchase ? Number(updatedCode.minPurchase) : null,
        maxDiscount: updatedCode.maxDiscount ? Number(updatedCode.maxDiscount) : null,
      },
    });

  } catch (error: any) {
    console.error("Error updating discount code / Endirim kodunu yeniləmə xətası:", error);
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
 * DELETE /api/seller/marketing/discount-codes/[id]
 * Delete a discount code / Endirim kodunu sil
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

    // Check if discount code exists and belongs to seller / Endirim kodunun mövcud olub satıcıya aid olub-olmadığını yoxla
    let discountCode;
    try {
      discountCode = await db.discountCode.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET discount code for delete');
      if (errorResponse) return errorResponse;

      discountCode = await db.discountCode.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    }

    if (!discountCode) {
      return NextResponse.json(
        { error: "Discount code not found / Endirim kodu tapılmadı" },
        { status: 404 }
      );
    }

    // Delete discount code / Endirim kodunu sil
    try {
      await db.discountCode.delete({
        where: { id },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'DELETE discount code');
      if (errorResponse) return errorResponse;

      await db.discountCode.delete({
        where: { id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Discount code deleted successfully / Endirim kodu uğurla silindi",
    });

  } catch (error: any) {
    console.error("Error deleting discount code / Endirim kodunu silmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

