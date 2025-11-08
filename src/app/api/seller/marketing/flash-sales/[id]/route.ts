/**
 * Flash Sale by ID API Route / ID-yə görə Flash Sale API Route-u
 * This route handles update and delete operations for a specific flash sale
 * Bu route müəyyən flash sale üçün yeniləmə və silmə əməliyyatlarını idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { z } from "zod";
import { handleDatabaseError } from "@/lib/db-utils";

// Update flash sale schema / Flash sale yeniləmə schema-sı
const updateFlashSaleSchema = z.object({
  productId: z.string().min(1).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/seller/marketing/flash-sales/[id]
 * Update a flash sale / Flash sale-i yenilə
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
    const validatedData = updateFlashSaleSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // Check if flash sale exists and belongs to seller / Flash sale-in mövcud olub satıcıya aid olub-olmadığını yoxla
    let flashSale;
    try {
      flashSale = await db.flashSale.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET flash sale for update');
      if (errorResponse) return errorResponse;

      flashSale = await db.flashSale.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    }

    if (!flashSale) {
      return NextResponse.json(
        { error: "Flash sale not found / Flash sale tapılmadı" },
        { status: 404 }
      );
    }

    // If product is being updated, check if it belongs to seller / Məhsul yenilənirsə, satıcıya aid olub-olmadığını yoxla
    const productId = validatedData.data.productId || flashSale.productId;
    if (validatedData.data.productId && validatedData.data.productId !== flashSale.productId) {
      let product;
      try {
        product = await db.product.findFirst({
          where: {
            id: productId,
            sellerId: actualSellerId,
          },
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'CHECK product');
        if (errorResponse) return errorResponse;

        product = await db.product.findFirst({
          where: {
            id: productId,
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
    }

    // Validate date range / Tarix aralığını yoxla
    const startDate = validatedData.data.startDate ? new Date(validatedData.data.startDate) : flashSale.startDate;
    const endDate = validatedData.data.endDate ? new Date(validatedData.data.endDate) : flashSale.endDate;
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date / Bitmə tarixi başlanğıc tarixindən sonra olmalıdır" },
        { status: 400 }
      );
    }

    // Check for overlapping active flash sales if dates are being updated / Tarixlər yenilənirsə üst-üstə düşən aktiv flash sale-ləri yoxla
    if (validatedData.data.startDate || validatedData.data.endDate) {
      let overlappingSale;
      try {
        overlappingSale = await db.flashSale.findFirst({
          where: {
            productId: productId,
            id: { not: id },
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
        const errorResponse = await handleDatabaseError(error, 'CHECK overlapping flash sale');
        if (errorResponse) return errorResponse;

        overlappingSale = await db.flashSale.findFirst({
          where: {
            productId: productId,
            id: { not: id },
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

      if (overlappingSale) {
        return NextResponse.json(
          { error: "An active flash sale already exists for this product in the specified date range / Bu məhsul üçün göstərilən tarix aralığında artıq aktiv flash sale mövcuddur" },
          { status: 400 }
        );
      }
    }

    // Prepare update data / Yeniləmə məlumatlarını hazırla
    const updateData: any = {};
    if (validatedData.data.productId !== undefined) updateData.productId = validatedData.data.productId;
    if (validatedData.data.discountPercentage !== undefined) updateData.discountPercentage = validatedData.data.discountPercentage;
    if (validatedData.data.startDate !== undefined) updateData.startDate = startDate;
    if (validatedData.data.endDate !== undefined) updateData.endDate = endDate;
    if (validatedData.data.isActive !== undefined) updateData.isActive = validatedData.data.isActive;

    // Update flash sale / Flash sale-i yenilə
    let updatedSale;
    try {
      updatedSale = await db.flashSale.update({
        where: { id },
        data: updateData,
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
      const errorResponse = await handleDatabaseError(error, 'PUT flash sale');
      if (errorResponse) return errorResponse;

      updatedSale = await db.flashSale.update({
        where: { id },
        data: updateData,
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
        ...updatedSale,
        discountPercentage: Number(updatedSale.discountPercentage),
      },
    });

  } catch (error: any) {
    console.error("Error updating flash sale / Flash sale-i yeniləmə xətası:", error);
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
 * DELETE /api/seller/marketing/flash-sales/[id]
 * Delete a flash sale / Flash sale-i sil
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

    // Check if flash sale exists and belongs to seller / Flash sale-in mövcud olub satıcıya aid olub-olmadığını yoxla
    let flashSale;
    try {
      flashSale = await db.flashSale.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET flash sale for delete');
      if (errorResponse) return errorResponse;

      flashSale = await db.flashSale.findFirst({
        where: {
          id,
          sellerId: actualSellerId,
        },
      });
    }

    if (!flashSale) {
      return NextResponse.json(
        { error: "Flash sale not found / Flash sale tapılmadı" },
        { status: 404 }
      );
    }

    // Delete flash sale / Flash sale-i sil
    try {
      await db.flashSale.delete({
        where: { id },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'DELETE flash sale');
      if (errorResponse) return errorResponse;

      await db.flashSale.delete({
        where: { id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Flash sale deleted successfully / Flash sale uğurla silindi",
    });

  } catch (error: any) {
    console.error("Error deleting flash sale / Flash sale-i silmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

