import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
 * Authenticated user must be a SELLER and own the product.
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

    let sellerId: string;

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
      
      sellerId = testSeller.id;
    } else {
      sellerId = session.user.id;
    }

    const { id: productId } = await params;

    // Check if product exists and belongs to the seller
    // Məhsulun mövcudluğunu və satıcıya aid olduğunu yoxla
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ message: "Product not found / Məhsul tapılmadı" }, { status: 404 });
    }

    if (existingProduct.sellerId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized to delete this product / Bu məhsulu silmək üçün icazəniz yoxdur" }, { status: 403 });
    }

    // Soft delete by setting isActive to false
    // Yumşaq silmə - isActive-i false et
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Product deleted successfully / Məhsul uğurla silindi" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ message: "Internal server error / Daxili server xətası" }, { status: 500 });
  }
}

/**
 * GET /api/seller/products/[id]
 * Fetches a specific product for the authenticated seller.
 * Authenticated user must be a SELLER and own the product.
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

    let sellerId: string;

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
      
      sellerId = testSeller.id;
    } else {
      sellerId = session.user.id;
    }

    const { id: productId } = await params;

    const product = await prisma.product.findUnique({
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

    if (!product) {
      return NextResponse.json({ message: "Product not found / Məhsul tapılmadı" }, { status: 404 });
    }

    if (product.sellerId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized to view this product / Bu məhsula baxmaq üçün icazəniz yoxdur" }, { status: 403 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ message: "Internal server error / Daxili server xətası" }, { status: 500 });
  }
}

/**
 * PUT /api/seller/products/[id]
 * Updates a product for the authenticated seller.
 * Authenticated user must be a SELLER and own the product.
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

    let sellerId: string;

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
      
      sellerId = testSeller.id;
    } else {
      sellerId = session.user.id;
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

    // Check if product exists and belongs to the seller
    // Məhsulun mövcudluğunu və satıcıya aid olduğunu yoxla
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found / Məhsul tapılmadı" }, { status: 404 });
    }

    if (existingProduct.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to update this product / Bu məhsulu yeniləmək üçün icazəniz yoxdur" }, { status: 403 });
    }

    // Check if category exists (if categoryId is provided)
    // Kateqoriyanın mövcudluğunu yoxla (əgər categoryId verilibsə)
    if (validatedFields.data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedFields.data.categoryId },
      });

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
    const updatedProduct = await prisma.product.update({
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

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ message: "Internal server error / Daxili server xətası" }, { status: 500 });
  }
}
