/**
 * Bulk Product Operations API Route / Toplu Məhsul Əməliyyatları API Route-u
 * POST /api/seller/products/bulk - Perform bulk operations on products
 * POST /api/seller/products/bulk - Məhsullar üzərində toplu əməliyyatlar yerinə yetir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { z } from "zod";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Bulk operation schema / Toplu əməliyyat sxemi
const bulkOperationSchema = z.object({
  operation: z.enum(["update", "delete", "activate", "deactivate"]),
  productIds: z.array(z.string()).min(1, "At least one product ID is required / Ən azı bir məhsul ID-si tələb olunur"),
  updateData: z.object({
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    categoryId: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/seller/products/bulk
 * Perform bulk operations on products (update, delete, activate, deactivate)
 * Məhsullar üzərində toplu əməliyyatlar yerinə yetir (yenilə, sil, aktivləşdir, deaktivləşdir)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    // Get actual seller ID (handles User Sellers) / Faktiki satıcı ID-sini al (User Seller-ləri idarə edir)
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

    const body = await request.json();
    const validatedData = bulkOperationSchema.parse(body);

    const { operation, productIds, updateData } = validatedData;

    // Verify all products belong to the seller / Bütün məhsulların satıcıya aid olduğunu yoxla
    let products;
    try {
      products = await db.product.findMany({
        where: {
          id: { in: productIds },
          sellerId: actualSellerId,
        },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST bulk products - verify products');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      products = await db.product.findMany({
        where: {
          id: { in: productIds },
          sellerId: actualSellerId,
        },
        select: {
          id: true,
          name: true,
        },
      });
    }

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { 
          error: "Some products not found or do not belong to you / Bəzi məhsullar tapılmadı və ya sizə aid deyil",
          found: products.length,
          requested: productIds.length,
        },
        { status: 400 }
      );
    }

    const foundProductIds = products.map(p => p.id);
    let result: any = {
      success: false,
      operation,
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Perform bulk operation / Toplu əməliyyatı yerinə yetir
    try {
      switch (operation) {
        case "update":
          if (!updateData || Object.keys(updateData).length === 0) {
            return NextResponse.json(
              { error: "updateData is required for update operation / Yeniləmə əməliyyatı üçün updateData tələb olunur" },
              { status: 400 }
            );
          }

          // Build update data / Yeniləmə məlumatlarını qur
          const updatePayload: any = {};
          if (updateData.price !== undefined) updatePayload.price = updateData.price;
          if (updateData.stock !== undefined) updatePayload.stock = updateData.stock;
          if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
          if (updateData.categoryId !== undefined) {
            // Verify category exists / Kateqoriyanın mövcud olduğunu yoxla
            let category;
            try {
              category = await db.category.findUnique({
                where: { id: updateData.categoryId },
              });
            } catch (error: any) {
              const errorResponse = await handleDatabaseError(error, 'POST bulk products - check category');
              if (errorResponse) return errorResponse;

              // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
              category = await db.category.findUnique({
                where: { id: updateData.categoryId },
              });
            }

            if (!category) {
              return NextResponse.json(
                { 
                  error: "Category not found / Kateqoriya tapılmadı",
                  errorAz: "Kateqoriya tapılmadı"
                },
                { status: 400 }
              );
            }
            updatePayload.categoryId = updateData.categoryId;
          }

          // Update products / Məhsulları yenilə
          let updateResult;
          try {
            updateResult = await db.product.updateMany({
              where: {
                id: { in: foundProductIds },
                sellerId: actualSellerId,
              },
              data: updatePayload,
            });
          } catch (error: any) {
            const errorResponse = await handleDatabaseError(error, 'POST bulk products - update');
            if (errorResponse) return errorResponse;

            // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
            updateResult = await db.product.updateMany({
              where: {
                id: { in: foundProductIds },
                sellerId: actualSellerId,
              },
              data: updatePayload,
            });
          }

          result.success = true;
          result.processed = updateResult.count;
          break;

        case "delete":
          // Delete products / Məhsulları sil
          let deleteResult;
          try {
            deleteResult = await db.product.deleteMany({
              where: {
                id: { in: foundProductIds },
                sellerId: actualSellerId,
              },
            });
          } catch (error: any) {
            const errorResponse = await handleDatabaseError(error, 'POST bulk products - delete');
            if (errorResponse) return errorResponse;

            // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
            deleteResult = await db.product.deleteMany({
              where: {
                id: { in: foundProductIds },
                sellerId: actualSellerId,
              },
            });
          }

          result.success = true;
          result.processed = deleteResult.count;
          break;

        case "activate":
          // Activate products / Məhsulları aktivləşdir
          let activateResult;
          try {
            activateResult = await db.product.updateMany({
              where: {
                id: { in: foundProductIds },
                sellerId: actualSellerId,
              },
              data: { isActive: true },
            });
          } catch (error: any) {
            const errorResponse = await handleDatabaseError(error, 'POST bulk products - activate');
            if (errorResponse) return errorResponse;

            // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
            activateResult = await db.product.updateMany({
              where: {
                id: { in: foundProductIds },
                sellerId: actualSellerId,
              },
              data: { isActive: true },
            });
          }

          result.success = true;
          result.processed = activateResult.count;
          break;

        case "deactivate":
          // Deactivate products / Məhsulları deaktivləşdir
          let deactivateResult;
          try {
            deactivateResult = await db.product.updateMany({
              where: {
                id: { in: foundProductIds },
                sellerId: actualSellerId,
              },
              data: { isActive: false },
            });
          } catch (error: any) {
            const errorResponse = await handleDatabaseError(error, 'POST bulk products - deactivate');
            if (errorResponse) return errorResponse;

            // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
            deactivateResult = await db.product.updateMany({
              where: {
                id: { in: foundProductIds },
                sellerId: actualSellerId,
              },
              data: { isActive: false },
            });
          }

          result.success = true;
          result.processed = deactivateResult.count;
          break;

        default:
          return NextResponse.json(
            { error: `Invalid operation: ${operation} / Etibarsız əməliyyat: ${operation}` },
            { status: 400 }
          );
      }
    } catch (error: any) {
      // Handle database connection errors / Veritabanı bağlantı xətalarını idarə et
      const errorResponse = await handleDatabaseError(error, 'POST bulk products - operation');
      if (errorResponse) {
        result.errors.push("Database connection error, please retry / Veritabanı bağlantı xətası, zəhmət olmasa yenidən cəhd edin");
        result.failed = foundProductIds.length;
      } else {
        result.errors.push(error.message || "Unknown error / Naməlum xəta");
        result.failed = foundProductIds.length;
      }
    }

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
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

    console.error("Error performing bulk operation:", error);
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
