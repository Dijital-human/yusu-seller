/**
 * Warehouse API Route / Anbar API Route-u
 * This route handles warehouse management (GET, POST, PUT, DELETE)
 * Bu route anbar idarəetməsini idarə edir (GET, POST, PUT, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { z } from "zod";
import { getActualSellerId, canCreateWarehouse } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Schema for creating/updating warehouse / Anbar yaratmaq/yeniləmək üçün schema
const warehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required / Anbar adı tələb olunur"),
  address: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

/**
 * GET /api/seller/warehouse
 * Get seller's warehouses / Satıcının anbarlarını al
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let currentUserId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      let testSeller;
      try {
        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET test seller for warehouses');
        if (errorResponse) return errorResponse;

        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      }
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session.user.id;
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId, isUserSeller } = await getActualSellerId(currentUserId);

    // Get warehouses with error handling
    // Xəta idarəetməsi ilə anbarları al
    let warehouses;
    try {
      warehouses = await db.warehouse.findMany({
        where: {
          sellerId: actualSellerId, // Super Seller ID (for both Super and User Sellers)
        },
        include: {
          stockItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                },
              },
            },
          },
          _count: {
            select: {
              operations: true,
              stockItems: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET warehouses');
      if (errorResponse) return errorResponse;

      warehouses = await db.warehouse.findMany({
        where: {
          sellerId: actualSellerId,
        },
        include: {
          stockItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                },
              },
            },
          },
          _count: {
            select: {
              operations: true,
              stockItems: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json({
      success: true,
      warehouses,
    });
  } catch (error: any) {
    console.error("Error fetching warehouses / Anbarları əldə etmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seller/warehouse
 * Create new warehouse / Yeni anbar yarat
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    let currentUserId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      let testSeller;
      try {
        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET test seller for warehouse create');
        if (errorResponse) return errorResponse;

        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      }
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session.user.id;
    }

    // Check if user can create warehouses (only Super Sellers and Admins)
    // İstifadəçinin anbar yarada biləcəyini yoxla (yalnız Super Seller-lər və Admin-lər)
    const canCreate = await canCreateWarehouse(currentUserId);
    if (!canCreate) {
      return NextResponse.json(
        { error: "Only Super Sellers can create warehouses / Yalnız Super Seller-lər anbar yarada bilər" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedData = warehouseSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    // Get actual seller ID (should be Super Seller for creation)
    // Həqiqi seller ID-ni al (yaratma üçün Super Seller olmalıdır)
    const { actualSellerId } = await getActualSellerId(currentUserId);

    // If this is set as default, unset other defaults / Əgər bu default olaraq təyin edilibsə, digər default-ları ləğv et
    if (validatedData.data.isDefault) {
      try {
        await db.warehouse.updateMany({
          where: {
            sellerId: actualSellerId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'UPDATE warehouses for default');
        if (errorResponse) return errorResponse;

        await db.warehouse.updateMany({
          where: {
            sellerId: actualSellerId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }
    }

    // Create warehouse / Anbar yarat
    let warehouse;
    try {
      warehouse = await db.warehouse.create({
        data: {
          sellerId: actualSellerId, // Super Seller ID
          name: validatedData.data.name,
          address: validatedData.data.address || null,
          isDefault: validatedData.data.isDefault || false,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST warehouse');
      if (errorResponse) return errorResponse;

      warehouse = await db.warehouse.create({
        data: {
          sellerId: actualSellerId,
          name: validatedData.data.name,
          address: validatedData.data.address || null,
          isDefault: validatedData.data.isDefault || false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Warehouse created successfully / Anbar uğurla yaradıldı",
      warehouse,
    });
  } catch (error: any) {
    console.error("Error creating warehouse / Anbar yaratma xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seller/warehouse
 * Update warehouse / Anbarı yenilə
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    let currentUserId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      let testSeller;
      try {
        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET test seller for warehouse update');
        if (errorResponse) return errorResponse;

        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      }
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session.user.id;
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Warehouse ID is required / Anbar ID tələb olunur" },
        { status: 400 }
      );
    }

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedData = warehouseSchema.safeParse(updateData);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId } = await getActualSellerId(currentUserId);

    // Check if warehouse belongs to seller / Anbarın satıcıya aid olduğunu yoxla
    let warehouse;
    try {
      warehouse = await db.warehouse.findFirst({
        where: {
          id: id,
          sellerId: actualSellerId, // Super Seller ID
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET warehouse for update');
      if (errorResponse) return errorResponse;

      warehouse = await db.warehouse.findFirst({
        where: {
          id: id,
          sellerId: actualSellerId,
        },
      });
    }

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found or access denied / Anbar tapılmadı və ya giriş qadağandır" },
        { status: 404 }
      );
    }

    // If this is set as default, unset other defaults / Əgər bu default olaraq təyin edilibsə, digər default-ları ləğv et
    if (validatedData.data.isDefault) {
      try {
        await db.warehouse.updateMany({
          where: {
            sellerId: actualSellerId,
            isDefault: true,
            NOT: { id: id },
          },
          data: {
            isDefault: false,
          },
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'UPDATE warehouses for default');
        if (errorResponse) return errorResponse;

        await db.warehouse.updateMany({
          where: {
            sellerId: actualSellerId,
            isDefault: true,
            NOT: { id: id },
          },
          data: {
            isDefault: false,
          },
        });
      }
    }

    // Update warehouse / Anbarı yenilə
    let updatedWarehouse;
    try {
      updatedWarehouse = await db.warehouse.update({
        where: { id: id },
        data: {
          name: validatedData.data.name,
          address: validatedData.data.address || null,
          isDefault: validatedData.data.isDefault || false,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT warehouse');
      if (errorResponse) return errorResponse;

      updatedWarehouse = await db.warehouse.update({
        where: { id: id },
        data: {
          name: validatedData.data.name,
          address: validatedData.data.address || null,
          isDefault: validatedData.data.isDefault || false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Warehouse updated successfully / Anbar uğurla yeniləndi",
      warehouse: updatedWarehouse,
    });
  } catch (error: any) {
    console.error("Error updating warehouse / Anbar yeniləmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/seller/warehouse
 * Delete warehouse / Anbarı sil
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    let currentUserId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      let testSeller;
      try {
        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      } catch (error: any) {
        const errorResponse = await handleDatabaseError(error, 'GET test seller for warehouse delete');
        if (errorResponse) return errorResponse;

        testSeller = await db.user.findFirst({
          where: { role: "SELLER" }
        });
      }
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      currentUserId = testSeller.id;
    } else {
      currentUserId = session.user.id;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Warehouse ID is required / Anbar ID tələb olunur" },
        { status: 400 }
      );
    }

    // Get actual seller ID (Super Seller ID for User Sellers)
    // Həqiqi seller ID-ni al (User Seller-lər üçün Super Seller ID)
    const { actualSellerId } = await getActualSellerId(currentUserId);

    // Check if warehouse belongs to seller / Anbarın satıcıya aid olduğunu yoxla
    let warehouse;
    try {
      warehouse = await db.warehouse.findFirst({
        where: {
          id: id,
          sellerId: actualSellerId, // Super Seller ID
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET warehouse for delete');
      if (errorResponse) return errorResponse;

      warehouse = await db.warehouse.findFirst({
        where: {
          id: id,
          sellerId: actualSellerId,
        },
      });
    }

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found or access denied / Anbar tapılmadı və ya giriş qadağandır" },
        { status: 404 }
      );
    }

    // Delete warehouse (cascade will delete stock items and operations) / Anbarı sil (cascade stock items və operations-ları siləcək)
    try {
      await db.warehouse.delete({
        where: { id: id },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'DELETE warehouse');
      if (errorResponse) return errorResponse;

      await db.warehouse.delete({
        where: { id: id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Warehouse deleted successfully / Anbar uğurla silindi",
    });
  } catch (error: any) {
    console.error("Error deleting warehouse / Anbar silmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

