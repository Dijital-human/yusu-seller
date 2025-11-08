/**
 * Unpublish Product API Route / Məhsul Yayımdan Çıxarma API Route-u
 * This route handles product unpublishing with Super Seller and User Seller permissions
 * Bu route Super Seller və User Seller icazələri ilə məhsul yayımdan çıxarmayı idarə edir
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

    let canUnpublish = false;

    if (isSuperSeller) {
      // Super Seller can unpublish, but needs admin approval / Super Seller yayımdan çıxara bilər, amma admin təsdiqi lazımdır
      canUnpublish = true;
    } else if (isUserSeller) {
      // User Seller needs permission / İstifadəçi Satıcı icazəyə ehtiyac duyur
      try {
        const permissions = seller.sellerPermissions 
          ? JSON.parse(seller.sellerPermissions)
          : {};
        canUnpublish = permissions.unpublishProducts === true;
      } catch (error) {
        console.error("Error parsing permissions:", error);
        canUnpublish = false;
      }
    } else {
      // Regular SELLER can unpublish (for backward compatibility) / Adi SELLER yayımdan çıxara bilər (geri uyğunluq üçün)
      canUnpublish = true;
    }

    if (!canUnpublish) {
      return NextResponse.json(
        { error: "You don't have permission to unpublish products / Məhsul yayımdan çıxarma icazəniz yoxdur" },
        { status: 403 }
      );
    }

    // Check if product can be unpublished / Məhsulun yayımdan çıxarıla biləcəyini yoxla
    if (!product.isPublished) {
      return NextResponse.json(
        { error: "Product is not published / Məhsul yayımlanmayıb" },
        { status: 400 }
      );
    }

    // Update product status (unpublish requires admin approval) / Məhsul statusunu yenilə (yayımdan çıxarma admin təsdiqi tələb edir)
    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        isPublished: false,
        isApproved: false, // Require admin approval for republishing / Yenidən yayımlamaq üçün admin təsdiqi tələb et
        publishedAt: null,
        updatedAt: new Date()
      },
      include: {
        seller: true,
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Product unpublished. Admin approval required for republishing / Məhsul yayımdan çıxarıldı. Yenidən yayımlamaq üçün admin təsdiqi tələb olunur",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Error unpublishing product / Məhsul yayımdan çıxarma xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Server xətası" },
      { status: 500 }
    );
  }
}
