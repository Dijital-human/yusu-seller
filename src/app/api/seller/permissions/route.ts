/**
 * Seller Permissions API Route / Satıcı İcazələri API Route-u
 * This route handles seller permissions (GET, PUT)
 * Bu route satıcı icazələrini idarə edir (GET, PUT)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for updating permissions / İcazələri yeniləmək üçün schema
const permissionsUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required / İstifadəçi ID tələb olunur"),
  permissions: z.object({
    viewPurchasePrice: z.boolean().optional(),
    publishProducts: z.boolean().optional(),
    unpublishProducts: z.boolean().optional(),
    manageWarehouse: z.boolean().optional(),
    useBarcode: z.boolean().optional(),
    usePOS: z.boolean().optional(),
  }),
});

/**
 * GET /api/seller/permissions
 * Get current user's permissions / Cari istifadəçinin icazələrini al
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user with seller info / İstifadəçini satıcı məlumatları ilə al
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        sellerType: true,
        sellerPermissions: true,
        superSellerId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found / İstifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    // Parse permissions / İcazələri parse et
    let permissions: any = {};
    if (user.sellerPermissions) {
      try {
        permissions = JSON.parse(user.sellerPermissions);
      } catch (error) {
        console.error("Error parsing seller permissions:", error);
      }
    }

    // Determine default permissions based on role / Rol əsasında varsayılan icazələri təyin et
    const isSuperSeller = user.role === "SUPER_SELLER" || user.sellerType === "SUPER_SELLER";
    const isUserSeller = user.role === "USER_SELLER" || user.sellerType === "USER_SELLER";

    if (isSuperSeller) {
      permissions = {
        viewPurchasePrice: true,
        publishProducts: true,
        unpublishProducts: true,
        manageUserSellers: true,
        manageWarehouse: true,
        useBarcode: true,
        usePOS: true,
        manageStorage: true,
      };
    } else if (isUserSeller) {
      permissions = {
        viewPurchasePrice: permissions.viewPurchasePrice ?? false,
        publishProducts: permissions.publishProducts ?? false,
        unpublishProducts: permissions.unpublishProducts ?? false,
        manageUserSellers: false,
        manageWarehouse: permissions.manageWarehouse ?? false,
        useBarcode: permissions.useBarcode ?? true,
        usePOS: permissions.usePOS ?? true,
        manageStorage: false,
      };
    }

    return NextResponse.json({
      success: true,
      permissions,
      isSuperSeller,
      isUserSeller,
    });
  } catch (error) {
    console.error("Error fetching permissions / İcazələri əldə etmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seller/permissions
 * Update User Seller permissions (only Super Seller can do this) / User Seller icazələrini yenilə (yalnız Super Seller edə bilər)
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

    const isSuperSeller = currentUser.role === "SUPER_SELLER" || currentUser.sellerType === "SUPER_SELLER";
    
    if (!isSuperSeller && currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Super Sellers can manage permissions / Yalnız Super Seller-lər icazələri idarə edə bilər" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedFields = permissionsUpdateSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedFields.error.errors 
        },
        { status: 400 }
      );
    }

    const { userId, permissions } = validatedFields.data;

    // Check if target user is User Seller of this Super Seller / Hədəf istifadəçinin bu Super Seller-in User Seller-i olub-olmadığını yoxla
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        sellerType: true,
        superSellerId: true,
        sellerPermissions: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found / Hədəf istifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    // Verify that target user is User Seller of current Super Seller / Hədəf istifadəçinin cari Super Seller-in User Seller-i olduğunu yoxla
    if (currentUser.role !== "ADMIN") {
      const isUserSeller = targetUser.role === "USER_SELLER" || targetUser.sellerType === "USER_SELLER";
      const belongsToSuperSeller = targetUser.superSellerId === currentUserId;

      if (!isUserSeller || !belongsToSuperSeller) {
        return NextResponse.json(
          { error: "You can only manage permissions for your User Sellers / Yalnız öz User Seller-lərinizin icazələrini idarə edə bilərsiniz" },
          { status: 403 }
        );
      }
    }

    // Merge with existing permissions / Mövcud icazələrlə birləşdir
    let existingPermissions: any = {};
    if (targetUser.sellerPermissions) {
      try {
        existingPermissions = JSON.parse(targetUser.sellerPermissions);
      } catch (error) {
        console.error("Error parsing existing permissions:", error);
      }
    }

    // Update permissions / İcazələri yenilə
    const updatedPermissions = {
      ...existingPermissions,
      ...permissions,
    };

    // Update user permissions / İstifadəçi icazələrini yenilə
    await db.user.update({
      where: { id: userId },
      data: {
        sellerPermissions: JSON.stringify(updatedPermissions),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully / İcazələr uğurla yeniləndi",
      permissions: updatedPermissions,
    });
  } catch (error) {
    console.error("Error updating permissions / İcazələri yeniləmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

