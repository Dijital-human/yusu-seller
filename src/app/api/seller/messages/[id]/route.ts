/**
 * Single Message API Route / Tək Mesaj API Route-u
 * This route handles fetching and deleting a single message
 * Bu route tək mesajı almağı və silməyi idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";

/**
 * GET /api/seller/messages/[id]
 * Get message details / Mesaj detallarını al
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

    const { id } = await params;
    const { actualSellerId } = await getActualSellerId(session.user.id);

    // Get message / Mesajı al
    let message;
    try {
      message = await db.sellerMessage.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        message = await db.sellerMessage.findUnique({
          where: { id },
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      } else {
        throw error;
      }
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message not found / Mesaj tapılmadı" },
        { status: 404 }
      );
    }

    // Check if message belongs to seller / Mesajın satıcıya aid olub-olmadığını yoxla
    if (message.sellerId !== actualSellerId) {
      return NextResponse.json(
        { error: "Forbidden / Qadağan" },
        { status: 403 }
      );
    }

    // Parse images JSON / Şəkillərin JSON-unu parse et
    let parsedImages = [];
    if (message.images && typeof message.images === 'string' && message.images.trim() !== '') {
      try {
        parsedImages = JSON.parse(message.images);
      } catch (error) {
        console.error('Error parsing images JSON / Şəkillərin JSON-unu parse etmə xətası:', error);
        parsedImages = [];
      }
    }
    const messageWithParsedImages = {
      ...message,
      images: parsedImages,
    };

    return NextResponse.json({
      success: true,
      message: messageWithParsedImages,
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/seller/messages/[id]
 * Delete message / Mesajı sil
 */
export async function DELETE(
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

    const { id } = await params;
    const { actualSellerId } = await getActualSellerId(session.user.id);

    // Check if message exists and belongs to seller / Mesajın mövcud olub-olmadığını və satıcıya aid olduğunu yoxla
    let message;
    try {
      message = await db.sellerMessage.findUnique({
        where: { id },
      });
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        message = await db.sellerMessage.findUnique({
          where: { id },
        });
      } else {
        throw error;
      }
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message not found / Mesaj tapılmadı" },
        { status: 404 }
      );
    }

    if (message.sellerId !== actualSellerId) {
      return NextResponse.json(
        { error: "Forbidden / Qadağan" },
        { status: 403 }
      );
    }

    // Delete message / Mesajı sil
    try {
      await db.sellerMessage.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        await db.sellerMessage.delete({
          where: { id },
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully / Mesaj uğurla silindi",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

