/**
 * Product Import Template API Route / Məhsul İdxal Şablonu API Route-u
 * GET /api/seller/products/import/template - Download import template
 * GET /api/seller/products/import/template - İdxal şablonunu yüklə
 */

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "excel"; // excel or csv

    // Create template data / Şablon məlumatları yarat
    const templateData = [
      {
        Name: "Example Product",
        Description: "This is an example product description",
        Price: 99.99,
        Stock: 100,
        Category: "Electronics",
        SKU: "PROD-001",
        Brand: "Example Brand",
        Images: '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
        IsActive: "Yes",
      },
    ];

    if (format === "excel") {
      // Create Excel workbook / Excel iş kitabı yarat
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      // Generate Excel buffer / Excel buffer yarat
      const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      // Return Excel file / Excel faylı qaytar
      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="product_import_template.xlsx"',
        },
      });
    } else {
      // Create CSV / CSV yarat
      const headers = Object.keys(templateData[0]);
      const csvRows = [
        headers.join(","),
        ...templateData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
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
          "Content-Disposition": 'attachment; filename="product_import_template.csv"',
        },
      });
    }
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

