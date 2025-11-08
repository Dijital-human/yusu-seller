/**
 * Product Import API Route / Məhsul İdxal API Route-u
 * POST /api/seller/products/import - Import products from CSV/Excel
 * POST /api/seller/products/import - Məhsulları CSV/Excel formatından idxal et
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { z } from "zod";
import * as XLSX from "xlsx";

// Product import schema / Məhsul idxal sxemi
const productImportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  categoryId: z.string().min(1),
  sku: z.string().optional(),
  brand: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    // Get actual seller ID / Faktiki satıcı ID-sini al
    const { actualSellerId } = await getActualSellerId(session.user.id);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided / Fayl təmin edilməyib" },
        { status: 400 }
      );
    }

    // Read file content / Fayl məzmununu oxu
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "File is empty or invalid / Fayl boşdur və ya etibarsızdır" },
        { status: 400 }
      );
    }

    // Get all categories for mapping / Xəritələmə üçün bütün kateqoriyaları al
    let categories;
    try {
      categories = await db.category.findMany({
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        categories = await db.category.findMany({
          select: {
            id: true,
            name: true,
          },
        });
      } else {
        throw error;
      }
    }

    const categoryMap = new Map(
      categories.map((cat) => [cat.name.toLowerCase(), cat.id])
    );

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Process each row / Hər sətri emal et
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      try {
        // Map CSV/Excel columns to our schema / CSV/Excel sütunlarını bizim sxemə xəritələ
        const categoryName = (row.Category || row.category || row.CATEGORY || "").toLowerCase();
        const categoryId = categoryMap.get(categoryName) || row.CategoryID || row.categoryId || row.Category_ID;

        if (!categoryId) {
          throw new Error(`Category not found: ${row.Category || row.category || row.CATEGORY || "N/A"}`);
        }

        // Parse images if provided / Təmin edilmişdirsə şəkilləri parse et
        let images: string[] = [];
        if (row.Images || row.images || row.IMAGES) {
          const imagesStr = row.Images || row.images || row.IMAGES;
          if (typeof imagesStr === "string") {
            try {
              images = JSON.parse(imagesStr);
            } catch {
              // If not JSON, treat as comma-separated / JSON deyilsə, vergüllə ayrılmış kimi müalicə et
              images = imagesStr.split(",").map((img: string) => img.trim()).filter(Boolean);
            }
          }
        }

        const productData = {
          name: row.Name || row.name || row.NAME || "",
          description: row.Description || row.description || row.DESCRIPTION || "",
          price: parseFloat(row.Price || row.price || row.PRICE || "0"),
          stock: parseInt(row.Stock || row.stock || row.STOCK || "0", 10),
          categoryId: categoryId,
          sku: row.SKU || row.sku || row.Sku || undefined,
          brand: row.Brand || row.brand || row.BRAND || undefined,
          images: images,
          isActive: row.IsActive !== undefined 
            ? (row.IsActive === "Yes" || row.IsActive === true || row.IsActive === "yes")
            : true,
        };

        // Validate data / Məlumatları yoxla
        const validatedData = productImportSchema.parse(productData);

        // Create product / Məhsul yarat
        try {
          await db.product.create({
            data: {
              ...validatedData,
              sellerId: actualSellerId,
              images: JSON.stringify(validatedData.images),
              isPublished: false,
              isApproved: false,
            },
          });

          results.success++;
        } catch (error: any) {
          if (error?.message?.includes('Closed') || error?.code === 'P1001') {
            await reconnectDatabase();
            // Retry create / Yenidən yaratmağı cəhd et
            await db.product.create({
              data: {
                ...validatedData,
                sellerId: actualSellerId,
                images: JSON.stringify(validatedData.images),
                isPublished: false,
                isApproved: false,
              },
            });
            results.success++;
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 2, // +2 because Excel rows are 1-indexed and we skip header
          error: error.message || "Unknown error / Naməlum xəta",
        });
      }
    }

    return NextResponse.json({
      message: `Import completed / İdxal tamamlandı`,
      results,
    }, { status: 200 });
  } catch (error) {
    console.error("Error importing products:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

