/**
 * Notification Settings API Route / Bildiriş Tənzimləmələri API Route-u
 * This route handles notification preferences for sellers
 * Bu route satıcılar üçün bildiriş seçimlərini idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { z } from "zod";
import { handleDatabaseError } from "@/lib/db-utils";

// Notification preferences schema / Bildiriş seçimləri schema-sı
const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  monthlyReports: z.boolean().optional(),
});

/**
 * GET /api/seller/settings/notifications
 * Get notification preferences / Bildiriş seçimlərini al
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

    const userId = session.user.id;

    let user;
    try {
      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          notificationPreferences: true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET notification preferences');
      if (errorResponse) return errorResponse;

      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          notificationPreferences: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found / İstifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    // Parse notification preferences / Bildiriş seçimlərini parse et
    let notificationPreferences = {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      orderUpdates: true,
      marketingEmails: false,
      weeklyReports: true,
      monthlyReports: true,
    };

    if (user.notificationPreferences) {
      try {
        notificationPreferences = JSON.parse(user.notificationPreferences);
      } catch (e) {
        // Use defaults / Default-ları istifadə et
      }
    }

    return NextResponse.json({
      notifications: notificationPreferences,
    });

  } catch (error: any) {
    console.error("Error fetching notification preferences / Bildiriş seçimlərini əldə etmə xətası:", error);
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
 * PUT /api/seller/settings/notifications
 * Update notification preferences / Bildiriş seçimlərini yenilə
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate notification preferences / Bildiriş seçimlərini yoxla
    const validatedData = notificationPreferencesSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // Update notification preferences / Bildiriş seçimlərini yenilə
    try {
      await db.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: JSON.stringify(validatedData.data),
        },
      });

      return NextResponse.json({
        success: true,
        notifications: validatedData.data,
        message: "Notification preferences updated successfully / Bildiriş seçimləri uğurla yeniləndi",
      });

    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT notification preferences');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      await db.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: JSON.stringify(validatedData.data),
        },
      });

      return NextResponse.json({
        success: true,
        notifications: validatedData.data,
        message: "Notification preferences updated successfully / Bildiriş seçimləri uğurla yeniləndi",
      });
    }

  } catch (error: any) {
    console.error("Error updating notification preferences / Bildiriş seçimlərini yeniləmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
