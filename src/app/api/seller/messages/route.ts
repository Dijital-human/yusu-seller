/**
 * Seller Messages API Route / Satıcı Mesajları API Route-u
 * This route handles sending messages to admin and fetching seller's messages
 * Bu route adminə mesaj göndərməyi və satıcının mesajlarını almağı idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { getActualSellerId } from "@/lib/warehouse-access";
import { z } from "zod";
import { MAX_IMAGES_PER_MESSAGE } from "@/lib/message-helpers";

// Message schema / Mesaj sxemi
const messageSchema = z.object({
  subject: z.string().min(1, "Subject is required / Başlıq tələb olunur"),
  message: z.string().min(1, "Message is required / Mesaj tələb olunur"),
  images: z.array(z.string()).max(MAX_IMAGES_PER_MESSAGE).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

/**
 * POST /api/seller/messages
 * Send message to admin / Adminə mesaj göndər
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    // Only Super Sellers can send messages / Yalnız Super Seller-lər mesaj göndərə bilər
    const { actualSellerId, isUserSeller } = await getActualSellerId(session.user.id);
    
    if (isUserSeller) {
      return NextResponse.json(
        { error: "Only Super Sellers can send messages to admin / Yalnız Super Seller-lər adminə mesaj göndərə bilər" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = messageSchema.parse(body);

    // Create message / Mesaj yarat
    let newMessage;
    try {
      newMessage = await db.sellerMessage.create({
        data: {
          sellerId: actualSellerId,
          subject: validatedData.subject,
          message: validatedData.message,
          images: validatedData.images ? JSON.stringify(validatedData.images) : null,
          priority: validatedData.priority,
          status: "PENDING",
        },
        include: {
          seller: {
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
        newMessage = await db.sellerMessage.create({
          data: {
            sellerId: actualSellerId,
            subject: validatedData.subject,
            message: validatedData.message,
            images: validatedData.images ? JSON.stringify(validatedData.images) : null,
            priority: validatedData.priority,
            status: "PENDING",
          },
          include: {
            seller: {
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

    return NextResponse.json({
      success: true,
      message: newMessage,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seller/messages
 * Get seller's messages / Satıcının mesajlarını al
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const { actualSellerId } = await getActualSellerId(session.user.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    // Build where clause / Where şərtini qur
    const where: any = { sellerId: actualSellerId };
    if (status && status !== "all") {
      where.status = status;
    }

    // Get messages with retry logic / Retry logic ilə mesajları al
    let messages, total;
    try {
      messages = await db.sellerMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      total = await db.sellerMessage.count({ where });
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        messages = await db.sellerMessage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        total = await db.sellerMessage.count({ where });
      } else {
        throw error;
      }
    }

    // Parse images JSON / Şəkillərin JSON-unu parse et
    const messagesWithParsedImages = messages.map(msg => {
      let parsedImages = [];
      if (msg.images && typeof msg.images === 'string' && msg.images.trim() !== '') {
        try {
          parsedImages = JSON.parse(msg.images);
        } catch (error) {
          console.error('Error parsing images JSON / Şəkillərin JSON-unu parse etmə xətası:', error);
          parsedImages = [];
        }
      }
      return {
        ...msg,
        images: parsedImages,
      };
    });

    return NextResponse.json({
      success: true,
      messages: messagesWithParsedImages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

