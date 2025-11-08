import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Schema for updating a variant / Variant yeniləmək üçün schema
const variantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  attributes: z.record(z.any()).optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/seller/products/[id]/variants/[variantId]
 * Update a variant
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { 
          error: "Unauthorized / Yetkisiz",
          errorAz: "Yetkisiz"
        },
        { status: 401 }
      );
    }

    // Get actual seller ID (for User Seller support) / Həqiqi seller ID-ni al (User Seller dəstəyi üçün)
    const { actualSellerId, isUserSeller } = await getActualSellerId(session.user.id);

    // Check permission for User Sellers / User Seller-lər üçün icazəni yoxla
    if (isUserSeller) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { sellerPermissions: true },
      });

      if (user?.sellerPermissions) {
        try {
          const permissions = JSON.parse(user.sellerPermissions);
          if (permissions.manageProducts !== true) {
            return NextResponse.json(
              { 
                error: "Permission denied. You need manageProducts permission. / İcazə rədd edildi. manageProducts icazəsinə ehtiyacınız var.",
                errorAz: "İcazə rədd edildi. manageProducts icazəsinə ehtiyacınız var."
              },
              { status: 403 }
            );
          }
        } catch (error) {
          console.error("Error parsing permissions:", error);
        }
      }
    }

    const { id: productId, variantId } = await params;

    // Check if product exists and belongs to seller / Məhsulun mövcud olub-olmadığını və satıcıya aid olub-olmadığını yoxla
    let product;
    try {
      product = await db.product.findFirst({
        where: {
          id: productId,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT variant - check product');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      product = await db.product.findFirst({
        where: {
          id: productId,
          sellerId: actualSellerId,
        },
      });
    }

    if (!product) {
      return NextResponse.json(
        { 
          error: "Product not found / Məhsul tapılmadı",
          errorAz: "Məhsul tapılmadı"
        },
        { status: 404 }
      );
    }

    // Check if variant exists and belongs to product / Variantın mövcud olub-olmadığını və məhsula aid olub-olmadığını yoxla
    let variant;
    try {
      variant = await db.productVariant.findFirst({
        where: {
          id: variantId,
          productId: productId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT variant - check variant');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      variant = await db.productVariant.findFirst({
        where: {
          id: variantId,
          productId: productId,
        },
      });
    }

    if (!variant) {
      return NextResponse.json(
        { 
          error: "Variant not found / Variant tapılmadı",
          errorAz: "Variant tapılmadı"
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = variantUpdateSchema.parse(body);

    // Check if SKU is unique (if provided and changed) / SKU-nun unikal olub-olmadığını yoxla (təmin edilərsə və dəyişdirilərsə)
    if (validatedData.sku && validatedData.sku !== variant.sku) {
      let existingVariant;
      try {
        existingVariant = await db.productVariant.findUnique({
          where: { sku: validatedData.sku },
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'PUT variant - check SKU');
        if (errorResponse) return errorResponse;

        // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
        existingVariant = await db.productVariant.findUnique({
          where: { sku: validatedData.sku },
        });
      }

      if (existingVariant) {
        return NextResponse.json(
          { 
            error: "SKU already exists / SKU artıq mövcuddur",
            errorAz: "SKU artıq mövcuddur"
          },
          { status: 400 }
        );
      }
    }

    // Update variant / Variantı yenilə
    let updatedVariant;
    try {
      updatedVariant = await db.productVariant.update({
        where: { id: variantId },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.sku !== undefined && { sku: validatedData.sku || null }),
          ...(validatedData.price !== undefined && { price: validatedData.price || null }),
          ...(validatedData.stock !== undefined && { stock: validatedData.stock }),
          ...(validatedData.attributes && { attributes: JSON.stringify(validatedData.attributes) }),
          ...(validatedData.image !== undefined && { image: validatedData.image || null }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT variant - update');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      updatedVariant = await db.productVariant.update({
        where: { id: variantId },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.sku !== undefined && { sku: validatedData.sku || null }),
          ...(validatedData.price !== undefined && { price: validatedData.price || null }),
          ...(validatedData.stock !== undefined && { stock: validatedData.stock }),
          ...(validatedData.attributes && { attributes: JSON.stringify(validatedData.attributes) }),
          ...(validatedData.image !== undefined && { image: validatedData.image || null }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
      });
    }

    return NextResponse.json(updatedVariant);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          errorAz: "Yoxlama xətası",
          details: error.errors.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        errorAz: "Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/seller/products/[id]/variants/[variantId]
 * Delete a variant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { 
          error: "Unauthorized / Yetkisiz",
          errorAz: "Yetkisiz"
        },
        { status: 401 }
      );
    }

    // Get actual seller ID (for User Seller support) / Həqiqi seller ID-ni al (User Seller dəstəyi üçün)
    const { actualSellerId, isUserSeller } = await getActualSellerId(session.user.id);

    // Check permission for User Sellers / User Seller-lər üçün icazəni yoxla
    if (isUserSeller) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { sellerPermissions: true },
      });

      if (user?.sellerPermissions) {
        try {
          const permissions = JSON.parse(user.sellerPermissions);
          if (permissions.manageProducts !== true) {
            return NextResponse.json(
              { 
                error: "Permission denied. You need manageProducts permission. / İcazə rədd edildi. manageProducts icazəsinə ehtiyacınız var.",
                errorAz: "İcazə rədd edildi. manageProducts icazəsinə ehtiyacınız var."
              },
              { status: 403 }
            );
          }
        } catch (error) {
          console.error("Error parsing permissions:", error);
        }
      }
    }

    const { id: productId, variantId } = await params;

    // Check if product exists and belongs to seller / Məhsulun mövcud olub-olmadığını və satıcıya aid olub-olmadığını yoxla
    let product;
    try {
      product = await db.product.findFirst({
        where: {
          id: productId,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'DELETE variant - check product');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      product = await db.product.findFirst({
        where: {
          id: productId,
          sellerId: actualSellerId,
        },
      });
    }

    if (!product) {
      return NextResponse.json(
        { 
          error: "Product not found / Məhsul tapılmadı",
          errorAz: "Məhsul tapılmadı"
        },
        { status: 404 }
      );
    }

    // Check if variant exists and belongs to product / Variantın mövcud olub-olmadığını və məhsula aid olub-olmadığını yoxla
    let variant;
    try {
      variant = await db.productVariant.findFirst({
        where: {
          id: variantId,
          productId: productId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'DELETE variant - check variant');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      variant = await db.productVariant.findFirst({
        where: {
          id: variantId,
          productId: productId,
        },
      });
    }

    if (!variant) {
      return NextResponse.json(
        { 
          error: "Variant not found / Variant tapılmadı",
          errorAz: "Variant tapılmadı"
        },
        { status: 404 }
      );
    }

    // Delete variant / Variantı sil
    try {
      await db.productVariant.delete({
        where: { id: variantId },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'DELETE variant - delete');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      await db.productVariant.delete({
        where: { id: variantId },
      });
    }

    return NextResponse.json({ 
      message: "Variant deleted successfully / Variant uğurla silindi",
      errorAz: "Variant uğurla silindi"
    });
  } catch (error: any) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        errorAz: "Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

