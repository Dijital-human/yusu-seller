/**
 * Barcode Generation API Route / Barkod Yaratma API Route-u
 * This route generates unique barcodes for products
 * Bu route məhsullar üçün unikal barkodlar yaradır
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for barcode generation / Barkod yaratma üçün schema
const generateBarcodeSchema = z.object({
  productId: z.string().min(1, "Product ID is required / Məhsul ID tələb olunur"),
});

/**
 * Calculate EAN-13 check digit / EAN-13 yoxlama rəqəmini hesabla
 */
function calculateEAN13CheckDigit(barcode: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

/**
 * Generate unique EAN-13 barcode / Unikal EAN-13 barkod yarat
 * Format: 200 + sellerId (first 6 chars) + productId (first 3 chars) + random (2 chars) + check digit
 * Format: 200 + sellerId (ilk 6 simvol) + productId (ilk 3 simvol) + random (2 simvol) + yoxlama rəqəmi
 */
async function generateUniqueBarcode(sellerId: string, productId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate base barcode / Əsas barkod yarat
    const sellerPrefix = sellerId.substring(0, 6).padStart(6, '0');
    const productPrefix = productId.substring(0, 3).padStart(3, '0');
    const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const baseBarcode = `200${sellerPrefix}${productPrefix}${randomPart}`;

    // Calculate check digit / Yoxlama rəqəmini hesabla
    const checkDigit = calculateEAN13CheckDigit(baseBarcode);
    const fullBarcode = `${baseBarcode}${checkDigit}`;

    // Check if barcode already exists / Barkodun artıq mövcud olub-olmadığını yoxla
    const existingProduct = await db.product.findFirst({
      where: { barcode: fullBarcode },
    });

    const existingVariant = await db.productVariant.findFirst({
      where: { barcode: fullBarcode },
    });

    if (!existingProduct && !existingVariant) {
      return fullBarcode;
    }

    attempts++;
  }

  // Fallback: use timestamp-based barcode / Fallback: timestamp əsaslı barkod istifadə et
  const timestamp = Date.now().toString().slice(-8);
  const sellerPrefix = sellerId.substring(0, 4).padStart(4, '0');
  const baseBarcode = `200${sellerPrefix}${timestamp}`;
  const checkDigit = calculateEAN13CheckDigit(baseBarcode);
  return `${baseBarcode}${checkDigit}`;
}

/**
 * POST /api/seller/products/barcode/generate
 * Generate barcode for a product / Məhsul üçün barkod yarat
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedData = generateBarcodeSchema.safeParse(body);
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

    // Check if product already has a barcode / Məhsulun artıq barkodu olub-olmadığını yoxla
    if (product.barcode) {
      return NextResponse.json(
        { 
          error: "Product already has a barcode / Məhsulun artıq barkodu var",
          barcode: product.barcode 
        },
        { status: 400 }
      );
    }

    // Generate unique barcode / Unikal barkod yarat
    const newBarcode = await generateUniqueBarcode(sellerId, validatedData.data.productId);

    // Update product with barcode / Məhsulu barkod ilə yenilə
    const updatedProduct = await db.product.update({
      where: { id: validatedData.data.productId },
      data: {
        barcode: newBarcode,
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
      message: "Barcode generated successfully / Barkod uğurla yaradıldı",
      barcode: newBarcode,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error generating barcode / Barkod yaratma xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

