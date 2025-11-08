/**
 * Publish Product API Route / Məhsul Yayımlama API Route-u
 * This route handles product publishing with Super Seller and User Seller permissions
 * Bu route Super Seller və User Seller icazələri ilə məhsul yayımlamayı idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Check if user is authenticated / İstifadəçinin giriş edib-edmədiyini yoxla
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Find the product / Məhsulu tap
    const product = await db.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            role: true,
            sellerType: true,
            sellerPermissions: true,
            superSellerId: true,
          },
        },
        category: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found / Məhsul tapılmadı" },
        { status: 404 }
      );
    }

    // Check if user owns the product / İstifadəçinin məhsula sahib olub-olmadığını yoxla
    if (product.sellerId !== userId) {
      return NextResponse.json(
        { error: "Access denied / Giriş qadağandır" },
        { status: 403 }
      );
    }

    // Check permissions / İcazələri yoxla
    const seller = product.seller;
    const isSuperSeller = seller.role === "SUPER_SELLER" || seller.sellerType === "SUPER_SELLER";
    const isUserSeller = seller.role === "USER_SELLER" || seller.sellerType === "USER_SELLER";

    let canPublish = false;

    if (isSuperSeller) {
      // Super Seller can always publish / Super Seller həmişə yayımlaya bilər
      canPublish = true;
    } else if (isUserSeller) {
      // User Seller needs permission / İstifadəçi Satıcı icazəyə ehtiyac duyur
      try {
        const permissions = seller.sellerPermissions 
          ? JSON.parse(seller.sellerPermissions)
          : {};
        canPublish = permissions.publishProducts === true;
      } catch (error) {
        console.error("Error parsing permissions:", error);
        canPublish = false;
      }
    } else {
      // Regular SELLER can publish (for backward compatibility) / Adi SELLER yayımlaya bilər (geri uyğunluq üçün)
      canPublish = true;
    }

    if (!canPublish) {
      return NextResponse.json(
        { error: "You don't have permission to publish products / Məhsul yayımlama icazəniz yoxdur" },
        { status: 403 }
      );
    }

    // Check if product can be published / Məhsulun yayımlana biləcəyini yoxla
    if (product.isPublished) {
      return NextResponse.json(
        { error: "Product is already published / Məhsul artıq yayımlanıb" },
        { status: 400 }
      );
    }

    // Update product status / Məhsul statusunu yenilə
    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        seller: true,
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Product published successfully / Məhsul uğurla yayımlandı",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Error publishing product / Məhsul yayımlama xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Server xətası" },
      { status: 500 }
    );
  }
}
