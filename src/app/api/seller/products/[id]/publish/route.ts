import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the product
    const product = await db.product.findUnique({
      where: { id },
      include: {
        seller: true,
        category: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found / Məhsul tapılmadı" },
        { status: 404 }
      );
    }

    // Check if product can be published
    if (product.isPublished) {
      return NextResponse.json(
        { error: "Product is already published / Məhsul artıq yayımlanıb" },
        { status: 400 }
      );
    }

    // Update product status to PENDING_APPROVAL
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
      message: "Product submitted for approval / Məhsul təsdiq üçün təqdim edildi",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Error publishing product:", error);
    return NextResponse.json(
      { error: "Internal server error / Server xətası" },
      { status: 500 }
    );
  }
}
