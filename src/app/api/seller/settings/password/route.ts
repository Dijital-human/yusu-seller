/**
 * Password Change API Route / Şifrə Dəyişmə API Route-u
 * This route handles password changes for sellers
 * Bu route satıcılar üçün şifrə dəyişməsini idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { handleDatabaseError } from "@/lib/db-utils";

// Password change schema / Şifrə dəyişmə schema-sı
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required / Hazırkı şifrə tələb olunur"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters / Şifrə ən azı 8 simvol olmalıdır")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter / Şifrə ən azı bir böyük hərf ehtiva etməlidir")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter / Şifrə ən azı bir kiçik hərf ehtiva etməlidir")
    .regex(/[0-9]/, "Password must contain at least one number / Şifrə ən azı bir rəqəm ehtiva etməlidir"),
  confirmPassword: z.string().min(1, "Please confirm your password / Şifrənizi təsdiq edin"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match / Şifrələr uyğun gəlmir",
  path: ["confirmPassword"],
});

/**
 * POST /api/seller/settings/password
 * Change seller password / Satıcı şifrəsini dəyiş
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

    const userId = session.user.id;
    const body = await request.json();

    // Validate password data / Şifrə məlumatlarını yoxla
    const validatedData = passwordChangeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation error / Yoxlama xətası",
          details: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // Get current user with password hash / Şifrə hash-i ilə cari istifadəçini al
    let user;
    try {
      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          passwordHash: true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'GET user for password change');
      if (errorResponse) return errorResponse;

      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          passwordHash: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found / İstifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    // Verify current password / Hazırkı şifrəni yoxla
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "No password set. Please use password reset / Şifrə təyin edilməyib. Şifrə sıfırlamadan istifadə edin" },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.data.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect / Hazırkı şifrə yanlışdır" },
        { status: 400 }
      );
    }

    // Hash new password / Yeni şifrəni hash et
    const hashedNewPassword = await bcrypt.hash(validatedData.data.newPassword, 10);

    // Update password / Şifrəni yenilə
    try {
      await db.user.update({
        where: { id: userId },
        data: {
          passwordHash: hashedNewPassword,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password changed successfully / Şifrə uğurla dəyişdirildi",
      });

    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'PUT password');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      await db.user.update({
        where: { id: userId },
        data: {
          passwordHash: hashedNewPassword,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password changed successfully / Şifrə uğurla dəyişdirildi",
      });
    }

  } catch (error: any) {
    console.error("Error changing password / Şifrə dəyişmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
