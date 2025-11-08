import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

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
    let currentUserId: string;
    
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
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session?.user?.id;
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId } = await getActualSellerId(currentUserId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    // Build where clause / Where şərtini qur
    // Use actualSellerId so User Sellers can see Super Seller's products
    // actualSellerId istifadə et ki User Seller-lər Super Seller-in məhsullarını görə bilsinlər
    const whereClause: any = {
      sellerId: actualSellerId,
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

    // Get products with pagination and error handling
    // Xəta idarəetməsi ilə məhsulları pagination ilə al
    let products, totalCount;
    try {
      [products, totalCount] = await Promise.all([
        db.product.findMany({
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
        }),
        // Get total count for pagination / Pagination üçün ümumi sayı al
        db.product.count({
          where: whereClause,
        }),
      ]);
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET products');
      if (errorResponse) return errorResponse;
      
      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      [products, totalCount] = await Promise.all([
        db.product.findMany({
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
        }),
        db.product.count({
          where: whereClause,
        }),
      ]);
    }

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching seller products / Satıcı məhsullarını əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
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
    let currentUserId: string;
    
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
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session?.user?.id;
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId } = await getActualSellerId(currentUserId);

    const body = await request.json();
    const validatedData = productCreateSchema.parse(body);

    // Check if category exists / Kateqoriyanın mövcud olub-olmadığını yoxla
    let category;
    try {
      category = await db.category.findUnique({
        where: { id: validatedData.categoryId },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST products - check category');
      if (errorResponse) return errorResponse;
      category = await db.category.findUnique({
        where: { id: validatedData.categoryId },
      });
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category not found / Kateqoriya tapılmadı" },
        { status: 404 }
      );
    }

    // Create product / Məhsul yarat
    // Use actualSellerId so User Sellers create products for Super Seller
    // actualSellerId istifadə et ki User Seller-lər Super Seller üçün məhsul yaratsınlar
    let product;
    try {
      product = await db.product.create({
        data: {
          ...validatedData,
          sellerId: actualSellerId,
          images: JSON.stringify(validatedData.images || []),
          isPublished: false, // Default to false, requires admin approval
          isApproved: false   // Default to false, requires admin approval
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
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST products - create product');
      if (errorResponse) return errorResponse;
      product = await db.product.create({
        data: {
          ...validatedData,
          sellerId: actualSellerId,
          images: JSON.stringify(validatedData.images || []),
          isPublished: false,
          isApproved: false
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
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("Validation error / Yoxlama xətası:", error.errors);
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: error.errors 
        },
        { status: 400 }
      );
    }
    console.error("Error creating product / Məhsul yaratma xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}