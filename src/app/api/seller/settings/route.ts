/**
 * Settings API Route / Tənzimləmələr API Route-u
 * This route handles seller settings (GET, PUT)
 * Bu route satıcı tənzimləmələrini idarə edir (GET, PUT)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { z } from "zod";
import { handleDatabaseError } from "@/lib/db-utils";

// Profile update schema / Profil yeniləmə schema-sı
const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required / Ad tələb olunur").optional(),
  email: z.string().email("Invalid email / Yanlış email").optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url("Invalid URL / Yanlış URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

/**
 * GET /api/seller/settings
 * Get seller settings / Satıcı tənzimləmələrini al
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
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          permissions: true, // For business info / Biznes məlumatları üçün
          notificationPreferences: true, // Will be added to schema / Schema-ya əlavə ediləcək
          lowStockThreshold: true, // Will be added to schema / Schema-ya əlavə ediləcək
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET settings');
      if (errorResponse) return errorResponse;

      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          permissions: true,
          notificationPreferences: true,
          lowStockThreshold: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found / İstifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    // Parse business info from permissions JSON if exists / Əgər varsa permissions JSON-dan biznes məlumatlarını parse et
    let businessInfo = {};
    if (user.permissions) {
      try {
        businessInfo = JSON.parse(user.permissions);
      } catch (e) {
        // Ignore parse errors / Parse xətalarını nəzərə alma
      }
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
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.image,
        company: (businessInfo as any).company || "",
        website: (businessInfo as any).website || "",
        description: (businessInfo as any).description || "",
        address: (businessInfo as any).address || "",
        city: (businessInfo as any).city || "",
        country: (businessInfo as any).country || "",
      },
      notifications: notificationPreferences,
      lowStockThreshold: user.lowStockThreshold || 10,
    });

  } catch (error: any) {
    console.error("Error fetching settings / Tənzimləmələri əldə etmə xətası:", error);
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
 * PUT /api/seller/settings
 * Update seller settings / Satıcı tənzimləmələrini yenilə
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

    // Validate profile data / Profil məlumatlarını yoxla
    const validatedData = profileUpdateSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // Get current user to preserve existing data / Mövcud məlumatları qorumaq üçün cari istifadəçini al
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        permissions: true,
      },
    });

    // Parse existing business info / Mövcud biznes məlumatlarını parse et
    let businessInfo: any = {};
    if (currentUser?.permissions) {
      try {
        businessInfo = JSON.parse(currentUser.permissions);
      } catch (e) {
        // Ignore parse errors / Parse xətalarını nəzərə alma
      }
    }

    // Update business info / Biznes məlumatlarını yenilə
    if (validatedData.data.company !== undefined) {
      businessInfo.company = validatedData.data.company;
    }
    if (validatedData.data.website !== undefined) {
      businessInfo.website = validatedData.data.website;
    }
    if (validatedData.data.description !== undefined) {
      businessInfo.description = validatedData.data.description;
    }

    // Prepare update data / Yeniləmə məlumatlarını hazırla
    const updateData: any = {};

    // Update low stock threshold if provided / Təmin edilərsə aşağı stok həddini yenilə
    if (validatedData.data.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = validatedData.data.lowStockThreshold;
    }
    
    if (validatedData.data.name !== undefined) {
      updateData.name = validatedData.data.name;
    }
    if (validatedData.data.email !== undefined) {
      updateData.email = validatedData.data.email;
    }
    if (validatedData.data.phone !== undefined) {
      updateData.phone = validatedData.data.phone;
    }
    if (Object.keys(businessInfo).length > 0) {
      updateData.permissions = JSON.stringify(businessInfo);
    }

    try {
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          permissions: true,
        },
      });

      // Parse business info for response / Cavab üçün biznes məlumatlarını parse et
      let responseBusinessInfo = {};
      if (updatedUser.permissions) {
        try {
          responseBusinessInfo = JSON.parse(updatedUser.permissions);
        } catch (e) {
          // Ignore parse errors / Parse xətalarını nəzərə alma
        }
      }

      return NextResponse.json({
        success: true,
        profile: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.image,
          company: (responseBusinessInfo as any).company || "",
          website: (responseBusinessInfo as any).website || "",
          description: (responseBusinessInfo as any).description || "",
        },
      });

    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT settings');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          permissions: true,
        },
      });

      let responseBusinessInfo = {};
      if (updatedUser.permissions) {
        try {
          responseBusinessInfo = JSON.parse(updatedUser.permissions);
        } catch (e) {
          // Ignore parse errors / Parse xətalarını nəzərə alma
        }
      }

      return NextResponse.json({
        success: true,
        profile: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.image,
          company: (responseBusinessInfo as any).company || "",
          website: (responseBusinessInfo as any).website || "",
          description: (responseBusinessInfo as any).description || "",
        },
      });
    }
  } catch (error: any) {
    console.error("Error updating settings / Tənzimləmələri yeniləmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

