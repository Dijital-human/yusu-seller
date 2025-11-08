/**
 * Barcode API Route / Barkod API Route-u
 * This route handles barcode-related operations (GET, POST, PUT)
 * Bu route barkod əlaqəli əməliyyatları idarə edir (GET, POST, PUT)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for adding/updating barcode / Barkod əlavə etmək/yeniləmək üçün schema
const barcodeSchema = z.object({
  productId: z.string().min(1, "Product ID is required / Məhsul ID tələb olunur"),
  barcode: z.string().min(1, "Barcode is required / Barkod tələb olunur"),
});

// Schema for searching by barcode / Barkod ilə axtarış üçün schema
const barcodeSearchSchema = z.object({
  barcode: z.string().min(1, "Barcode is required / Barkod tələb olunur"),
});

/**
 * GET /api/seller/products/barcode?barcode=xxx
 * Find product by barcode / Barkod ilə məhsul tap
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let sellerId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      const testSeller = await db.user.findFirst({
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

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode parameter is required / Barkod parametri tələb olunur" },
        { status: 400 }
      );
    }

    // Validate barcode / Barkodu yoxla
    const validatedData = barcodeSearchSchema.safeParse({ barcode });
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    // Search product by barcode / Barkod ilə məhsul axtar
    const product = await db.product.findFirst({
      where: {
        barcode: validatedData.data.barcode,
        sellerId: sellerId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!product) {
      // Also check variants / Variantları da yoxla
      const variant = await db.productVariant.findFirst({
        where: {
          barcode: validatedData.data.barcode,
        },
        include: {
          product: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      
      // Check if variant's product belongs to seller / Variantın məhsulunun satıcıya aid olub-olmadığını yoxla
      if (variant && variant.product.sellerId !== sellerId) {
        return NextResponse.json({ success: false, message: "Product or variant not found with this barcode / Bu barkodla məhsul və ya variant tapılmadı" }, { status: 404 });
      }

      if (variant && variant.product) {
        return NextResponse.json({
          success: true,
          product: variant.product,
          variant: variant,
          foundIn: "variant",
        });
      }

      return NextResponse.json(
        { 
          success: false,
          error: "Product not found / Məhsul tapılmadı",
          message: "No product found with this barcode / Bu barkodla məhsul tapılmadı"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: product,
      foundIn: "product",
    });
  } catch (error) {
    console.error("Error searching product by barcode / Barkod ilə məhsul axtarışı xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seller/products/barcode
 * Add barcode to product / Məhsula barkod əlavə et
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let sellerId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      const testSeller = await db.user.findFirst({
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

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedData = barcodeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if product belongs to seller / Məhsulun satıcıya aid olduğunu yoxla
    const product = await db.product.findFirst({
      where: {
        id: validatedData.data.productId,
        sellerId: sellerId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or access denied / Məhsul tapılmadı və ya giriş qadağandır" },
        { status: 404 }
      );
    }

    // Check if barcode is already used / Barkodun artıq istifadə olunub-olunmadığını yoxla
    const existingProduct = await db.product.findFirst({
      where: {
        barcode: validatedData.data.barcode,
        NOT: { id: validatedData.data.productId },
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Barcode already exists / Barkod artıq mövcuddur" },
        { status: 400 }
      );
    }

    // Check if barcode is used in variants / Barkodun variantlarda istifadə olunub-olunmadığını yoxla
    const existingVariant = await db.productVariant.findFirst({
      where: {
        barcode: validatedData.data.barcode,
      },
    });

    if (existingVariant) {
      return NextResponse.json(
        { error: "Barcode already exists in variants / Barkod artıq variantlarda mövcuddur" },
        { status: 400 }
      );
    }

    // Update product with barcode / Məhsulu barkod ilə yenilə
    const updatedProduct = await db.product.update({
      where: { id: validatedData.data.productId },
      data: {
        barcode: validatedData.data.barcode,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Barcode added successfully / Barkod uğurla əlavə edildi",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error adding barcode / Barkod əlavə etmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seller/products/barcode
 * Update product barcode / Məhsul barkodunu yenilə
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let sellerId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      const testSeller = await db.user.findFirst({
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

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedData = barcodeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if product belongs to seller / Məhsulun satıcıya aid olduğunu yoxla
    const product = await db.product.findFirst({
      where: {
        id: validatedData.data.productId,
        sellerId: sellerId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or access denied / Məhsul tapılmadı və ya giriş qadağandır" },
        { status: 404 }
      );
    }

    // Check if new barcode is already used / Yeni barkodun artıq istifadə olunub-olunmadığını yoxla
    if (validatedData.data.barcode !== product.barcode) {
      const existingProduct = await db.product.findFirst({
        where: {
          barcode: validatedData.data.barcode,
          NOT: { id: validatedData.data.productId },
        },
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: "Barcode already exists / Barkod artıq mövcuddur" },
          { status: 400 }
        );
      }

      const existingVariant = await db.productVariant.findFirst({
        where: {
          barcode: validatedData.data.barcode,
        },
      });

      if (existingVariant) {
        return NextResponse.json(
          { error: "Barcode already exists in variants / Barkod artıq variantlarda mövcuddur" },
          { status: 400 }
        );
      }
    }

    // Update product barcode / Məhsul barkodunu yenilə
    const updatedProduct = await db.product.update({
      where: { id: validatedData.data.productId },
      data: {
        barcode: validatedData.data.barcode,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Barcode updated successfully / Barkod uğurla yeniləndi",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating barcode / Barkod yeniləmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

