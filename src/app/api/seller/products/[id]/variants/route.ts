import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { z } from "zod";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Schema for creating a variant / Variant yaratmaq üçün schema
const variantCreateSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  attributes: z.record(z.any()), // JSON object
  image: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

// Schema for updating a variant / Variant yeniləmək üçün schema
const variantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  attributes: z.record(z.any()).optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/seller/products/[id]/variants
 * Get all variants for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    // Get actual seller ID (for User Seller support) / Həqiqi seller ID-ni al (User Seller dəstəyi üçün)
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

    const { id: productId } = await params;

    // Check if product exists and belongs to seller / Məhsulun mövcud olub-olmadığını və satıcıya aid olub-olmadığını yoxla
    let product;
    try {
      product = await db.product.findFirst({
        where: {
          id: productId,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET product variants');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      product = await db.product.findFirst({
        where: {
          id: productId,
          sellerId: actualSellerId,
        },
      });
    }

    if (!product) {
      return NextResponse.json(
        { 
          error: "Product not found / Məhsul tapılmadı",
          errorAz: "Məhsul tapılmadı"
        },
        { status: 404 }
      );
    }

    // Get all variants for this product / Bu məhsul üçün bütün variantları al
    let variants;
    try {
      variants = await db.productVariant.findMany({
        where: {
          productId: productId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET product variants');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      variants = await db.productVariant.findMany({
        where: {
          productId: productId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(variants);
  } catch (error: any) {
    console.error("Error fetching variants:", error);
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

/**
 * POST /api/seller/products/[id]/variants
 * Create a new variant for a product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    // Get actual seller ID (for User Seller support) / Həqiqi seller ID-ni al (User Seller dəstəyi üçün)
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

    const { id: productId } = await params;

    // Check if product exists and belongs to seller / Məhsulun mövcud olub-olmadığını və satıcıya aid olub-olmadığını yoxla
    let product;
    try {
      product = await db.product.findFirst({
        where: {
          id: productId,
          sellerId: actualSellerId,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST product variant - check product');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      product = await db.product.findFirst({
        where: {
          id: productId,
          sellerId: actualSellerId,
        },
      });
    }

    if (!product) {
      return NextResponse.json(
        { 
          error: "Product not found / Məhsul tapılmadı",
          errorAz: "Məhsul tapılmadı"
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = variantCreateSchema.parse(body);

    // Check if SKU is unique (if provided) / SKU-nun unikal olub-olmadığını yoxla (təmin edilərsə)
    if (validatedData.sku) {
      let existingVariant;
      try {
        existingVariant = await db.productVariant.findUnique({
          where: { sku: validatedData.sku },
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'POST product variant - check SKU');
        if (errorResponse) return errorResponse;

        // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
        existingVariant = await db.productVariant.findUnique({
          where: { sku: validatedData.sku },
        });
      }

      if (existingVariant) {
        return NextResponse.json(
          { 
            error: "SKU already exists / SKU artıq mövcuddur",
            errorAz: "SKU artıq mövcuddur"
          },
          { status: 400 }
        );
      }
    }

    // Create variant / Variant yarat
    let variant;
    try {
      variant = await db.productVariant.create({
        data: {
          productId: productId,
          name: validatedData.name,
          sku: validatedData.sku || null,
          price: validatedData.price ? validatedData.price : null,
          stock: validatedData.stock,
          attributes: JSON.stringify(validatedData.attributes),
          image: validatedData.image || null,
          isActive: validatedData.isActive,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST product variant - create');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      variant = await db.productVariant.create({
        data: {
          productId: productId,
          name: validatedData.name,
          sku: validatedData.sku || null,
          price: validatedData.price ? validatedData.price : null,
          stock: validatedData.stock,
          attributes: JSON.stringify(validatedData.attributes),
          image: validatedData.image || null,
          isActive: validatedData.isActive,
        },
      });
    }

    return NextResponse.json(variant, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          errorAz: "Yoxlama xətası",
          details: error.errors.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }
    console.error("Error creating variant:", error);
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

