import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, db } from "@/lib/db";
import { z } from "zod";
import { getActualSellerId, canManageWarehouse } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Product update schema / Məhsul yeniləmə sxemi
const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().min(1).optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * DELETE /api/seller/products/[id]
 * Deletes a product for the authenticated seller.
 * Authenticated user must be a SELLER and own the product (or have manageWarehouse permission for User Sellers).
 * Giriş edən istifadəçi SELLER olmalıdır və məhsula sahib olmalıdır (və ya User Seller-lər üçün manageWarehouse icazəsi olmalıdır).
 *
 * @param {Request} req - The incoming request.
 * @param {Object} params - Route parameters containing the product ID.
 * @returns {NextResponse} - A response indicating success or error.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    let currentUserId: string;

    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      const testSeller = await prisma.user.findFirst({
        where: { role: "SELLER" }
      });
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session?.user?.id;
    }

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized / İcazə yoxdur" }, { status: 401 });
    }

    const { id: productId } = await params;

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId, isUserSeller } = await getActualSellerId(currentUserId);

    // Check if product exists and belongs to the actual seller
    // Məhsulun mövcudluğunu və həqiqi satıcıya aid olduğunu yoxla
    let existingProduct;
    try {
      existingProduct = await db.product.findUnique({
        where: { id: productId },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET product for delete');
      if (errorResponse) return errorResponse;

      existingProduct = await db.product.findUnique({
        where: { id: productId },
      });
    }

    if (!existingProduct) {
      return NextResponse.json({ message: "Product not found / Məhsul tapılmadı" }, { status: 404 });
    }

    // Check if product belongs to actual seller
    // Məhsulun həqiqi satıcıya aid olub-olmadığını yoxla
    if (existingProduct.sellerId !== actualSellerId) {
      return NextResponse.json({ 
        message: "Unauthorized to delete this product / Bu məhsulu silmək üçün icazəniz yoxdur" 
      }, { status: 403 });
    }

    // If user is User Seller, check manageWarehouse permission
    // Əgər istifadəçi User Seller-dirsə, manageWarehouse icazəsini yoxla
    if (isUserSeller) {
      const hasPermission = await canManageWarehouse(currentUserId);
      if (!hasPermission) {
        return NextResponse.json({ 
          message: "You don't have permission to delete products / Məhsul silmək üçün icazəniz yoxdur" 
        }, { status: 403 });
      }
    }

    // Soft delete by setting isActive to false
    // Yumşaq silmə - isActive-i false et
    try {
      await db.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'DELETE product');
      if (errorResponse) return errorResponse;

      await db.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ message: "Product deleted successfully / Məhsul uğurla silindi" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting product / Məhsul silmə xətası:", error);
    return NextResponse.json({ 
      error: "Internal server error / Daxili server xətası",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/seller/products/[id]
 * Fetches a specific product for the authenticated seller.
 * Authenticated user must be a SELLER and own the product (or have access via Super Seller for User Sellers).
 * Giriş edən istifadəçi SELLER olmalıdır və məhsula sahib olmalıdır (və ya User Seller-lər üçün Super Seller vasitəsilə giriş olmalıdır).
 *
 * @param {Request} req - The incoming request.
 * @param {Object} params - Route parameters containing the product ID.
 * @returns {NextResponse} - A response containing the product or an error.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    let currentUserId: string;

    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      let testSeller;
      try {
        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET test seller for product');
        if (errorResponse) return errorResponse;

        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      }
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session?.user?.id;
    }

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized / İcazə yoxdur" }, { status: 401 });
    }

    const { id: productId } = await params;

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId } = await getActualSellerId(currentUserId);

    let product;
    try {
      product = await db.product.findUnique({
        where: { id: productId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET product');
      if (errorResponse) return errorResponse;

      product = await db.product.findUnique({
        where: { id: productId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    if (!product) {
      return NextResponse.json({ message: "Product not found / Məhsul tapılmadı" }, { status: 404 });
    }

    // Check if product belongs to actual seller
    // Məhsulun həqiqi satıcıya aid olub-olmadığını yoxla
    if (product.sellerId !== actualSellerId) {
      return NextResponse.json({ 
        message: "Unauthorized to view this product / Bu məhsula baxmaq üçün icazəniz yoxdur" 
      }, { status: 403 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching product / Məhsul əldə etmə xətası:", error);
    return NextResponse.json({ 
      error: "Internal server error / Daxili server xətası",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * PUT /api/seller/products/[id]
 * Updates a product for the authenticated seller.
 * Authenticated user must be a SELLER and own the product (or have manageWarehouse permission for User Sellers).
 * Giriş edən istifadəçi SELLER olmalıdır və məhsula sahib olmalıdır (və ya User Seller-lər üçün manageWarehouse icazəsi olmalıdır).
 *
 * @param {Request} req - The incoming request.
 * @param {Object} params - Route parameters containing the product ID.
 * @returns {NextResponse} - A response containing the updated product or an error.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    let currentUserId: string;

    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      let testSeller;
      try {
        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET test seller for product update');
        if (errorResponse) return errorResponse;

        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      }
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session?.user?.id;
    }

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized / İcazə yoxdur" }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await req.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedFields = productUpdateSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedFields.error.errors 
        },
        { status: 400 }
      );
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId, isUserSeller } = await getActualSellerId(currentUserId);

    // Check if product exists and belongs to the actual seller
    // Məhsulun mövcudluğunu və həqiqi satıcıya aid olduğunu yoxla
    let existingProduct;
    try {
      existingProduct = await db.product.findUnique({
        where: { id: productId },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET product for update');
      if (errorResponse) return errorResponse;

      existingProduct = await db.product.findUnique({
        where: { id: productId },
      });
    }

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found / Məhsul tapılmadı" }, { status: 404 });
    }

    // Check if product belongs to actual seller
    // Məhsulun həqiqi satıcıya aid olub-olmadığını yoxla
    if (existingProduct.sellerId !== actualSellerId) {
      return NextResponse.json({ 
        error: "Unauthorized to update this product / Bu məhsulu yeniləmək üçün icazəniz yoxdur" 
      }, { status: 403 });
    }

    // If user is User Seller, check manageWarehouse permission
    // Əgər istifadəçi User Seller-dirsə, manageWarehouse icazəsini yoxla
    if (isUserSeller) {
      const hasPermission = await canManageWarehouse(currentUserId);
      if (!hasPermission) {
        return NextResponse.json({ 
          error: "You don't have permission to update products / Məhsul yeniləmək üçün icazəniz yoxdur" 
        }, { status: 403 });
      }
    }

    // Check if category exists (if categoryId is provided)
    // Kateqoriyanın mövcudluğunu yoxla (əgər categoryId verilibsə)
    if (validatedFields.data.categoryId) {
      let category;
      try {
        category = await db.category.findUnique({
          where: { id: validatedFields.data.categoryId },
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET category for product update');
        if (errorResponse) return errorResponse;

        category = await db.category.findUnique({
          where: { id: validatedFields.data.categoryId },
        });
      }

      if (!category) {
        return NextResponse.json(
          { error: "Category not found / Kateqoriya tapılmadı" },
          { status: 404 }
        );
      }
    }

    // Prepare update data / Yeniləmə məlumatlarını hazırla
    const updateData: any = { ...validatedFields.data };
    if (updateData.images) {
      updateData.images = JSON.stringify(updateData.images);
    }

    // Update product
    // Məhsulu yenilə
    let updatedProduct;
    try {
      updatedProduct = await db.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT product');
      if (errorResponse) return errorResponse;

      updatedProduct = await db.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    console.error("Error updating product / Məhsul yeniləmə xətası:", error);
    return NextResponse.json({ 
      error: "Internal server error / Daxili server xətası",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
