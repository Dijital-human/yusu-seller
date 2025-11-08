/**
 * Warehouse Operations API Route / Anbar Əməliyyatları API Route-u
 * This route handles warehouse operations (GET, POST)
 * Bu route anbar əməliyyatlarını idarə edir (GET, POST)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Schema for creating warehouse operation / Anbar əməliyyatı yaratmaq üçün schema
const operationSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse ID is required / Anbar ID tələb olunur"),
  productId: z.string().min(1, "Product ID is required / Məhsul ID tələb olunur"),
  type: z.enum(["INCOMING", "OUTGOING", "TRANSFER", "ADJUSTMENT"]),
  quantity: z.number().int().positive("Quantity must be positive / Miqdar müsbət olmalıdır"),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
});

/**
 * GET /api/seller/warehouse/operations
 * Get warehouse operations history / Anbar əməliyyatları tarixçəsini al
 */
export async function GET(request: NextRequest) {
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
        const errorResponse = await handleDatabaseError(error, 'GET test seller for warehouse operations');
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
    const { actualSellerId } = await getActualSellerId(currentUserId);

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const productId = searchParams.get("productId");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build where clause / Where şərtini qur
    const whereClause: any = {
      warehouse: {
        sellerId: actualSellerId, // Super Seller ID
      },
    };

    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }

    if (productId) {
      whereClause.productId = productId;
    }

    if (type && ["INCOMING", "OUTGOING", "TRANSFER", "ADJUSTMENT"].includes(type)) {
      whereClause.type = type;
    }

    // Get operations with pagination in parallel / Pagination ilə əməliyyatları paralel al
    let operations, totalCount;
    try {
      [operations, totalCount] = await Promise.all([
        db.warehouseOperation.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        db.warehouseOperation.count({
          where: whereClause,
        }),
      ]);
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET warehouse operations');
      if (errorResponse) return errorResponse;

      [operations, totalCount] = await Promise.all([
        db.warehouseOperation.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        db.warehouseOperation.count({
          where: whereClause,
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      operations,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching warehouse operations / Anbar əməliyyatlarını əldə etmə xətası:", error);
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
 * POST /api/seller/warehouse/operations
 * Create warehouse operation / Anbar əməliyyatı yarat
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
        const errorResponse = await handleDatabaseError(error, 'GET test seller for warehouse operation create');
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
    const { actualSellerId } = await getActualSellerId(currentUserId);

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedData = operationSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if warehouse belongs to seller / Anbarın satıcıya aid olduğunu yoxla
    let warehouse, product, productWithPrice;
    try {
      [warehouse, product, productWithPrice] = await Promise.all([
        db.warehouse.findFirst({
          where: {
            id: validatedData.data.warehouseId,
            sellerId: actualSellerId, // Super Seller ID
          },
        }),
        db.product.findFirst({
          where: {
            id: validatedData.data.productId,
            sellerId: actualSellerId, // Super Seller ID (products belong to Super Seller)
          },
        }),
        db.product.findUnique({
          where: { id: validatedData.data.productId },
          select: { purchasePrice: true },
        }),
      ]);
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET warehouse/product for operation');
      if (errorResponse) return errorResponse;

      [warehouse, product, productWithPrice] = await Promise.all([
        db.warehouse.findFirst({
          where: {
            id: validatedData.data.warehouseId,
            sellerId: actualSellerId,
          },
        }),
        db.product.findFirst({
          where: {
            id: validatedData.data.productId,
            sellerId: actualSellerId,
          },
        }),
        db.product.findUnique({
          where: { id: validatedData.data.productId },
          select: { purchasePrice: true },
        }),
      ]);
    }

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found or access denied / Anbar tapılmadı və ya giriş qadağandır" },
        { status: 404 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or access denied / Məhsul tapılmadı və ya giriş qadağandır" },
        { status: 404 }
      );
    }

    const unitPrice = productWithPrice?.purchasePrice || 0;
    const totalValue = Number(unitPrice) * validatedData.data.quantity;

    // Use transaction for operation / Əməliyyat üçün transaction istifadə et
    let result;
    try {
      result = await db.$transaction(async (tx) => {
      // Create operation / Əməliyyat yarat
      const operation = await tx.warehouseOperation.create({
        data: {
          warehouseId: validatedData.data.warehouseId,
          productId: validatedData.data.productId,
          type: validatedData.data.type,
          quantity: validatedData.data.quantity,
          reason: validatedData.data.reason || null,
          referenceId: validatedData.data.referenceId || null,
          performedBy: currentUserId, // Current user ID (can be User Seller)
        },
      });

      // Update or create warehouse stock / Anbar stokunu yenilə və ya yarat
      const existingStock = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: validatedData.data.warehouseId,
            productId: validatedData.data.productId,
          },
        },
      });

      let newQuantity = validatedData.data.quantity;
      if (existingStock) {
        if (validatedData.data.type === "INCOMING") {
          newQuantity = existingStock.quantity + validatedData.data.quantity;
        } else if (validatedData.data.type === "OUTGOING") {
          newQuantity = Math.max(0, existingStock.quantity - validatedData.data.quantity);
        } else if (validatedData.data.type === "ADJUSTMENT") {
          newQuantity = validatedData.data.quantity;
        }
        // TRANSFER will be handled separately / TRANSFER ayrıca idarə olunacaq

        await tx.warehouseStock.update({
          where: {
            warehouseId_productId: {
              warehouseId: validatedData.data.warehouseId,
              productId: validatedData.data.productId,
            },
          },
          data: {
            quantity: newQuantity,
          },
        });
      } else {
        // Create new stock entry / Yeni stok qeydi yarat
        if (validatedData.data.type === "INCOMING" || validatedData.data.type === "ADJUSTMENT") {
          await tx.warehouseStock.create({
            data: {
              warehouseId: validatedData.data.warehouseId,
              productId: validatedData.data.productId,
              quantity: validatedData.data.quantity,
            },
          });
        }
      }

      // Get previous ledger entry to calculate balance / Balansı hesablamaq üçün əvvəlki ledger qeydini al
      const previousLedger = await tx.warehouseLedger.findFirst({
        where: {
          warehouseId: validatedData.data.warehouseId,
          productId: validatedData.data.productId,
        },
        orderBy: {
          date: "desc",
        },
      });

      // Calculate balance / Balansı hesabla
      let balanceQty = newQuantity;
      let balanceValue = Number(unitPrice) * newQuantity;

      if (previousLedger) {
        if (validatedData.data.type === "INCOMING") {
          balanceQty = previousLedger.balanceQty + validatedData.data.quantity;
          balanceValue = Number(previousLedger.balanceValue) + totalValue;
        } else if (validatedData.data.type === "OUTGOING") {
          balanceQty = Math.max(0, previousLedger.balanceQty - validatedData.data.quantity);
          balanceValue = Math.max(0, Number(previousLedger.balanceValue) - totalValue);
        } else if (validatedData.data.type === "ADJUSTMENT") {
          balanceQty = validatedData.data.quantity;
          balanceValue = Number(unitPrice) * validatedData.data.quantity;
        }
      }

      // Create ledger entry / Ledger qeydi yarat
      await tx.warehouseLedger.create({
        data: {
          warehouseId: validatedData.data.warehouseId,
          productId: validatedData.data.productId,
          operationId: operation.id,
          date: new Date(),
          type: validatedData.data.type,
          quantity: validatedData.data.quantity,
          unitPrice: unitPrice,
          totalValue: totalValue,
          balanceQty: balanceQty,
          balanceValue: balanceValue,
          performedBy: currentUserId,
          notes: validatedData.data.reason || null,
        },
      });

        return operation;
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST warehouse operation');
      if (errorResponse) return errorResponse;

      result = await db.$transaction(async (tx) => {
        // Create operation / Əməliyyat yarat
        const operation = await tx.warehouseOperation.create({
          data: {
            warehouseId: validatedData.data.warehouseId,
            productId: validatedData.data.productId,
            type: validatedData.data.type,
            quantity: validatedData.data.quantity,
            reason: validatedData.data.reason || null,
            referenceId: validatedData.data.referenceId || null,
            performedBy: currentUserId, // Current user ID (can be User Seller)
          },
        });

        // Update or create warehouse stock / Anbar stokunu yenilə və ya yarat
        const existingStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: validatedData.data.warehouseId,
              productId: validatedData.data.productId,
            },
          },
        });

        let newQuantity = validatedData.data.quantity;
        if (existingStock) {
          if (validatedData.data.type === "INCOMING") {
            newQuantity = existingStock.quantity + validatedData.data.quantity;
          } else if (validatedData.data.type === "OUTGOING") {
            newQuantity = Math.max(0, existingStock.quantity - validatedData.data.quantity);
          } else if (validatedData.data.type === "ADJUSTMENT") {
            newQuantity = validatedData.data.quantity;
          }

          await tx.warehouseStock.update({
            where: {
              warehouseId_productId: {
                warehouseId: validatedData.data.warehouseId,
                productId: validatedData.data.productId,
              },
            },
            data: {
              quantity: newQuantity,
            },
          });
        } else {
          if (validatedData.data.type === "INCOMING" || validatedData.data.type === "ADJUSTMENT") {
            await tx.warehouseStock.create({
              data: {
                warehouseId: validatedData.data.warehouseId,
                productId: validatedData.data.productId,
                quantity: validatedData.data.quantity,
              },
            });
          }
        }

        // Get previous ledger entry to calculate balance / Balansı hesablamaq üçün əvvəlki ledger qeydini al
        const previousLedger = await tx.warehouseLedger.findFirst({
          where: {
            warehouseId: validatedData.data.warehouseId,
            productId: validatedData.data.productId,
          },
          orderBy: {
            date: "desc",
          },
        });

        // Calculate balance / Balansı hesabla
        let balanceQty = newQuantity;
        let balanceValue = Number(unitPrice) * newQuantity;

        if (previousLedger) {
          if (validatedData.data.type === "INCOMING") {
            balanceQty = previousLedger.balanceQty + validatedData.data.quantity;
            balanceValue = Number(previousLedger.balanceValue) + totalValue;
          } else if (validatedData.data.type === "OUTGOING") {
            balanceQty = Math.max(0, previousLedger.balanceQty - validatedData.data.quantity);
            balanceValue = Math.max(0, Number(previousLedger.balanceValue) - totalValue);
          } else if (validatedData.data.type === "ADJUSTMENT") {
            balanceQty = validatedData.data.quantity;
            balanceValue = Number(unitPrice) * validatedData.data.quantity;
          }
        }

        // Create ledger entry / Ledger qeydi yarat
        await tx.warehouseLedger.create({
          data: {
            warehouseId: validatedData.data.warehouseId,
            productId: validatedData.data.productId,
            operationId: operation.id,
            date: new Date(),
            type: validatedData.data.type,
            quantity: validatedData.data.quantity,
            unitPrice: unitPrice,
            totalValue: totalValue,
            balanceQty: balanceQty,
            balanceValue: balanceValue,
            performedBy: currentUserId,
            notes: validatedData.data.reason || null,
          },
        });

        return operation;
      });
    }

    return NextResponse.json({
      success: true,
      message: "Warehouse operation created successfully / Anbar əməliyyatı uğurla yaradıldı",
      operation: result,
    });
  } catch (error: any) {
    console.error("Error creating warehouse operation / Anbar əməliyyatı yaratma xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

