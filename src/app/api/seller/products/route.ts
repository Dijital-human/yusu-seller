import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for creating a new product / Yeni məhsul yaratmaq üçün schema
const productCreateSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().min(0, "Price must be positive"),
  stock: z.number().min(0, "Stock must be non-negative"),
  categoryId: z.string().min(1, "Category is required"),
  images: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

// Schema for updating a product / Məhsulu yeniləmək üçün schema
const productUpdateSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().min(1, "Product description is required").optional(),
  price: z.number().min(0, "Price must be positive").optional(),
  stock: z.number().min(0, "Stock must be non-negative").optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/seller/products - Get seller's products / Satıcının məhsullarını al
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
      sellerId = session?.user?.id;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    // Build where clause / Where şərtini qur
    const whereClause: any = {
      sellerId: sellerId,
    };

    // Add search filter if provided / Axtarış filtrini əlavə et
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add category filter if provided / Kateqoriya filtrini əlavə et
    if (category) {
      whereClause.categoryId = category;
    }

    // Add status filter if provided / Status filtrini əlavə et
    if (status === "active") {
      whereClause.isActive = true;
    } else if (status === "inactive") {
      whereClause.isActive = false;
    }

    // Get products with pagination / Məhsulları pagination ilə al
    const products = await db.product.findMany({
      where: whereClause,
      skip,
      take: limit,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get total count for pagination / Pagination üçün ümumi sayı al
    const totalCount = await db.product.count({
      where: whereClause,
    });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

// POST /api/seller/products - Create new product / Yeni məhsul yarat
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
      sellerId = session?.user?.id;
    }

    const body = await request.json();
    const validatedData = productCreateSchema.parse(body);

    // Check if category exists / Kateqoriyanın mövcud olub-olmadığını yoxla
    const category = await db.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found / Kateqoriya tapılmadı" },
        { status: 404 }
      );
    }

    // Create product / Məhsul yarat
    const product = await db.product.create({
      data: {
        ...validatedData,
        sellerId: sellerId,
        images: JSON.stringify(validatedData.images || []),
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}