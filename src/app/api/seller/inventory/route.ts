/**
 * Inventory API Route / Anbar API Route-u
 * This route handles inventory management for sellers
 * Bu route satıcılar üçün anbar idarəetməsini idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getActualSellerId } from "@/lib/warehouse-access";

// GET /api/seller/inventory - Get seller's inventory / Satıcının anbarını al
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let currentUserId: string;
    
    if (!session || session.user?.role !== UserRole.SELLER) {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      const testSeller = await db.user.findFirst({
        where: { role: UserRole.SELLER }
      });
      
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
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "all";

    // Get all products for this seller / Bu satıcı üçün bütün məhsulları al
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

    // Get products with inventory information / Anbar məlumatları ilə məhsulları al
    const products = await db.product.findMany({
      where: whereClause,
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
        updatedAt: "desc",
      },
    });

    // Calculate inventory metrics / Anbar metrikalarını hesabla
    const totalItems = products.length;
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock < 10).length;
    const outOfStockItems = products.filter(p => p.stock === 0).length;
    
    // Calculate total inventory value / Ümumi anbar dəyərini hesabla
    const totalValue = products.reduce((sum, product) => {
      return sum + (Number(product.price) * product.stock);
    }, 0);

    // Calculate average turnover (simplified) / Orta dövriyyəni hesabla (sadələşdirilmiş)
    const totalSales = products.reduce((sum, product) => {
      return sum + product._count.orderItems;
    }, 0);
    const averageTurnover = totalItems > 0 ? totalSales / totalItems : 0;

    // Get top selling items / Ən çox satılan məhsulları al
    const topSellingItems = products
      .sort((a, b) => b._count.orderItems - a._count.orderItems)
      .slice(0, 10)
      .length;

    // Format inventory items / Anbar elementlərini formatla
    const inventoryItems = products.map((product) => {
      let status: 'in_stock' | 'low_stock' | 'out_of_stock';
      if (product.stock === 0) {
        status = 'out_of_stock';
      } else if (product.stock < 10) {
        status = 'low_stock';
      } else {
        status = 'in_stock';
      }

      // Parse images if it's a JSON string / Əgər JSON string-dirsə şəkilləri parse et
      let images: string[] = [];
      try {
        if (typeof product.images === 'string') {
          images = JSON.parse(product.images);
        } else if (Array.isArray(product.images)) {
          images = product.images;
        }
      } catch (e) {
        images = [];
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.id.slice(-8).toUpperCase(), // Simplified SKU / Sadələşdirilmiş SKU
        category: product.category.name,
        currentStock: product.stock,
        minStock: 10, // Default minimum stock / Varsayılan minimum stok
        maxStock: 100, // Default maximum stock / Varsayılan maksimum stok
        cost: Number(product.price) * 0.7, // Estimated cost (70% of price) / Təxmini xərc (qiymətin 70%)
        price: Number(product.price),
        status,
        lastUpdated: product.updatedAt,
        supplier: "Internal", // Default supplier / Varsayılan təchizatçı
        images,
        sales: product._count.orderItems,
      };
    });

    // Apply status filter / Status filtrini tətbiq et
    let filteredItems = inventoryItems;
    if (statusFilter !== "all") {
      filteredItems = inventoryItems.filter(item => item.status === statusFilter);
    }

    // Inventory metrics / Anbar metrikaları
    const metrics = {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      averageTurnover: Math.round(averageTurnover * 10) / 10,
      topSellingItems,
    };

    return NextResponse.json({
      success: true,
      items: filteredItems,
      metrics,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

// PUT /api/seller/inventory/[id] - Update product stock / Məhsul stokunu yenilə
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    let currentUserId: string;
    
    if (!session || session.user?.role !== UserRole.SELLER) {
      const testSeller = await db.user.findFirst({
        where: { role: UserRole.SELLER }
      });
      
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
    const { productId, stock, minStock, maxStock } = body;

    if (!productId || stock === undefined) {
      return NextResponse.json(
        { error: "Product ID and stock are required / Məhsul ID və stok tələb olunur" },
        { status: 400 }
      );
    }

    // Verify product belongs to seller / Məhsulun satıcıya aid olduğunu yoxla
    const product = await db.product.findFirst({
      where: {
        id: productId,
        sellerId: actualSellerId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or access denied / Məhsul tapılmadı və ya giriş qadağandır" },
        { status: 404 }
      );
    }

    // Update product stock / Məhsul stokunu yenilə
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        stock: parseInt(stock.toString()),
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        updatedAt: updatedProduct.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

