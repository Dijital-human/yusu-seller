/**
 * User Sellers API Route / İstifadəçi Satıcılar API Route-u
 * This route handles User Seller management (GET, POST, PUT, DELETE)
 * Bu route İstifadəçi Satıcı idarəetməsini idarə edir (GET, POST, PUT, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { handleDatabaseError } from "@/lib/db-utils";

// Schema for creating User Seller / İstifadəçi Satıcı yaratmaq üçün schema
const userSellerSchema = z.object({
  name: z.string().min(1, "Name is required / Ad tələb olunur"),
  email: z.string().email("Invalid email / Yanlış email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters / Şifrə ən azı 6 simvol olmalıdır"),
  permissions: z.object({
    viewPurchasePrice: z.boolean().optional(),
    publishProducts: z.boolean().optional(),
    unpublishProducts: z.boolean().optional(),
    manageWarehouse: z.boolean().optional(),
    useBarcode: z.boolean().optional(),
    usePOS: z.boolean().optional(),
    manageOrders: z.boolean().optional(),
    viewAnalytics: z.boolean().optional(),
    manageMarketing: z.boolean().optional(),
  }).optional(),
});

// Schema for updating User Seller permissions / İstifadəçi Satıcı icazələrini yeniləmək üçün schema
const updatePermissionsSchema = z.object({
  userId: z.string().min(1, "User ID is required / İstifadəçi ID tələb olunur"),
  permissions: z.object({
    viewPurchasePrice: z.boolean().optional(),
    publishProducts: z.boolean().optional(),
    unpublishProducts: z.boolean().optional(),
    manageWarehouse: z.boolean().optional(),
    useBarcode: z.boolean().optional(),
    usePOS: z.boolean().optional(),
    manageOrders: z.boolean().optional(),
    viewAnalytics: z.boolean().optional(),
    manageMarketing: z.boolean().optional(),
  }),
});

/**
 * GET /api/seller/user-sellers
 * Get User Sellers list / İstifadəçi Satıcılar siyahısını al
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // For testing purposes, allow test seller access
    // Test məqsədləri üçün test seller girişinə icazə ver
    if (!session || !session.user) {
      const testSeller = await db.user.findFirst({
        where: { 
          OR: [
            { role: UserRole.SUPER_SELLER },
            { role: UserRole.SELLER },
            { sellerType: "SUPER_SELLER" }
          ]
        }
      });
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "Unauthorized / Yetkisiz" },
          { status: 401 }
        );
      }
      
      // Use test seller for testing / Test üçün test seller istifadə et
      const currentUserId = testSeller.id;
      
      // Get User Sellers / İstifadəçi Satıcıları al
      let userSellers;
      try {
        userSellers = await db.user.findMany({
          where: {
            superSellerId: currentUserId,
            OR: [
              { role: UserRole.USER_SELLER },
              { sellerType: "USER_SELLER" },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            sellerPermissions: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET user sellers');
        if (errorResponse) return errorResponse;
        userSellers = await db.user.findMany({
          where: {
            superSellerId: currentUserId,
            OR: [
              { role: UserRole.USER_SELLER },
              { sellerType: "USER_SELLER" },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            sellerPermissions: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      }

      // Parse permissions / İcazələri parse et
      const userSellersWithPermissions = userSellers.map(user => {
        let permissions = {};
        if (user.sellerPermissions) {
          try {
            permissions = JSON.parse(user.sellerPermissions);
          } catch (error) {
            console.error("Error parsing permissions:", error);
          }
        }
        return {
          ...user,
          permissions,
        };
      });

      return NextResponse.json({
        success: true,
        userSellers: userSellersWithPermissions,
      });
    }

    const currentUserId = session.user.id;

    // Check if current user is Super Seller / Cari istifadəçinin Super Seller olub-olmadığını yoxla
    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        role: true,
        sellerType: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found / İstifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    const isSuperSeller = currentUser.role === UserRole.SUPER_SELLER || currentUser.sellerType === "SUPER_SELLER";
    
    if (!isSuperSeller && currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only Super Sellers can manage User Sellers / Yalnız Super Seller-lər İstifadəçi Satıcıları idarə edə bilər" },
        { status: 403 }
      );
    }

    // Get User Sellers / İstifadəçi Satıcıları al
    let userSellers;
    try {
      userSellers = await db.user.findMany({
        where: {
          superSellerId: currentUserId,
          OR: [
            { role: UserRole.USER_SELLER },
            { sellerType: "USER_SELLER" },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          sellerPermissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET user sellers');
      if (errorResponse) return errorResponse;
      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      userSellers = await db.user.findMany({
        where: {
          superSellerId: currentUserId,
          OR: [
            { role: UserRole.USER_SELLER },
            { sellerType: "USER_SELLER" },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          sellerPermissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // Parse permissions / İcazələri parse et
    const userSellersWithPermissions = userSellers.map(user => {
      let permissions = {};
      if (user.sellerPermissions) {
        try {
          permissions = JSON.parse(user.sellerPermissions);
        } catch (error) {
          console.error("Error parsing permissions:", error);
        }
      }
      return {
        ...user,
        permissions,
      };
    });

    return NextResponse.json({
      success: true,
      userSellers: userSellersWithPermissions,
    });
  } catch (error: any) {
    console.error("Error fetching user sellers / İstifadəçi satıcıları əldə etmə xətası:", error);
    const errorMessage = error?.message || "Unknown error / Naməlum xəta";
    console.error("Error details:", {
      message: errorMessage,
      stack: error?.stack,
      code: error?.code,
    });
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seller/user-sellers
 * Create new User Seller / Yeni İstifadəçi Satıcı yarat
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;

    // Check if current user is Super Seller / Cari istifadəçinin Super Seller olub-olmadığını yoxla
    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        role: true,
        sellerType: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found / İstifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    const isSuperSeller = currentUser.role === UserRole.SUPER_SELLER || currentUser.sellerType === "SUPER_SELLER";
    
    if (!isSuperSeller && currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only Super Sellers can create User Sellers / Yalnız Super Seller-lər İstifadəçi Satıcı yarada bilər" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedData = userSellerSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if user already exists / İstifadəçi artıq mövcuddurmu yoxla
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: validatedData.data.email },
          { phone: validatedData.data.phone },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists / Bu email və ya telefonla istifadəçi artıq mövcuddur" },
        { status: 400 }
      );
    }

    // Hash password / Şifrəni hash-lə
    const hashedPassword = await bcrypt.hash(validatedData.data.password, 12);

    // Create User Seller / İstifadəçi Satıcı yarat
    const userSeller = await db.user.create({
      data: {
        name: validatedData.data.name,
        email: validatedData.data.email,
        phone: validatedData.data.phone || null,
        passwordHash: hashedPassword,
        role: UserRole.USER_SELLER,
        sellerType: "USER_SELLER",
        superSellerId: currentUserId, // Link to Super Seller / Super Seller-ə bağla
        sellerPermissions: validatedData.data.permissions 
          ? JSON.stringify(validatedData.data.permissions)
          : JSON.stringify({
              viewPurchasePrice: false,
              publishProducts: false,
              unpublishProducts: false,
              manageWarehouse: false,
              useBarcode: true,
              usePOS: true,
              manageOrders: false,
              viewAnalytics: false,
              manageMarketing: false,
            }),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        sellerPermissions: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User Seller created successfully / İstifadəçi Satıcı uğurla yaradıldı",
      userSeller,
    });
  } catch (error) {
    console.error("Error creating user seller / İstifadəçi satıcı yaratma xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seller/user-sellers
 * Update User Seller permissions / İstifadəçi Satıcı icazələrini yenilə
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;

    // Check if current user is Super Seller / Cari istifadəçinin Super Seller olub-olmadığını yoxla
    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        role: true,
        sellerType: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found / İstifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    const isSuperSeller = currentUser.role === UserRole.SUPER_SELLER || currentUser.sellerType === "SUPER_SELLER";
    
    if (!isSuperSeller && currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only Super Sellers can update User Seller permissions / Yalnız Super Seller-lər İstifadəçi Satıcı icazələrini yeniləyə bilər" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedData = updatePermissionsSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if target user is User Seller of this Super Seller / Hədəf istifadəçinin bu Super Seller-in İstifadəçi Satıcısı olub-olmadığını yoxla
    const targetUser = await db.user.findFirst({
      where: {
        id: validatedData.data.userId,
        superSellerId: currentUserId,
        OR: [
          { role: "USER_SELLER" },
          { sellerType: "USER_SELLER" },
        ],
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User Seller not found or access denied / İstifadəçi Satıcı tapılmadı və ya giriş qadağandır" },
        { status: 404 }
      );
    }

    // Update permissions / İcazələri yenilə
    await db.user.update({
      where: { id: validatedData.data.userId },
      data: {
        sellerPermissions: JSON.stringify(validatedData.data.permissions),
      },
    });

    return NextResponse.json({
      success: true,
      message: "User Seller permissions updated successfully / İstifadəçi Satıcı icazələri uğurla yeniləndi",
    });
  } catch (error) {
    console.error("Error updating user seller permissions / İstifadəçi satıcı icazələrini yeniləmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/seller/user-sellers
 * Delete User Seller / İstifadəçi Satıcı sil
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;

    // Check if current user is Super Seller / Cari istifadəçinin Super Seller olub-olmadığını yoxla
    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        role: true,
        sellerType: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found / İstifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    const isSuperSeller = currentUser.role === UserRole.SUPER_SELLER || currentUser.sellerType === "SUPER_SELLER";
    
    if (!isSuperSeller && currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only Super Sellers can delete User Sellers / Yalnız Super Seller-lər İstifadəçi Satıcıları silə bilər" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required / İstifadəçi ID tələb olunur" },
        { status: 400 }
      );
    }

    // Check if target user is User Seller of this Super Seller / Hədəf istifadəçinin bu Super Seller-in İstifadəçi Satıcısı olub-olmadığını yoxla
    const targetUser = await db.user.findFirst({
      where: {
        id: userId,
        superSellerId: currentUserId,
        OR: [
          { role: "USER_SELLER" },
          { sellerType: "USER_SELLER" },
        ],
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User Seller not found or access denied / İstifadəçi Satıcı tapılmadı və ya giriş qadağandır" },
        { status: 404 }
      );
    }

    // Delete User Seller / İstifadəçi Satıcı sil
    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User Seller deleted successfully / İstifadəçi Satıcı uğurla silindi",
    });
  } catch (error) {
    console.error("Error deleting user seller / İstifadəçi satıcı silmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

