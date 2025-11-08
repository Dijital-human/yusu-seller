/**
 * Product Export API Route / Məhsul İxrac API Route-u
 * GET /api/seller/products/export - Export products to CSV/Excel
 * GET /api/seller/products/export - Məhsulları CSV/Excel formatında ixrac et
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv"; // csv or excel

    // Get all products for the seller / Satıcının bütün məhsullarını al
    let products;
    try {
      products = await db.product.findMany({
        where: {
          sellerId: actualSellerId,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        products = await db.product.findMany({
          where: {
            sellerId: actualSellerId,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      } else {
        throw error;
      }
    }

    // Format products for export / İxrac üçün məhsulları formatla
    const exportData = products.map((product) => {
      const images = product.images ? JSON.parse(product.images) : [];
      return {
        ID: product.id,
        Name: product.name,
        Description: product.description || "",
        Price: Number(product.price),
        Stock: product.stock,
        Category: product.category?.name || "",
        CategoryID: product.categoryId || "",
        SKU: product.sku || "",
        Brand: product.brand || "",
        Images: images.join(", "),
        IsActive: product.isActive ? "Yes" : "No",
        IsPublished: product.isPublished ? "Yes" : "No",
        CreatedAt: product.createdAt.toISOString(),
        UpdatedAt: product.updatedAt.toISOString(),
      };
    });

    if (format === "excel") {
      // Create Excel workbook / Excel iş kitabı yarat
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      // Generate Excel buffer / Excel buffer yarat
      const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      // Return Excel file / Excel faylı qaytar
      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="products_${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    } else {
      // Create CSV / CSV yarat
      if (exportData.length === 0) {
        return NextResponse.json(
          { error: "No products to export / İxrac ediləcək məhsul yoxdur" },
          { status: 400 }
        );
      }

      // Get headers / Başlıqları al
      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              // Escape commas and quotes in CSV / CSV-də vergül və dırnaq işarələrini qaçır
              if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");

      // Return CSV file / CSV faylı qaytar
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="products_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting products:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

