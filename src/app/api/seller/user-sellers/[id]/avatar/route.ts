/**
 * User Seller Avatar API Route / İstifadəçi Satıcı Avatar API Route-u
 * This route handles avatar image uploads for user sellers
 * Bu route istifadəçi satıcılar üçün avatar şəkil yükləmələrini idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

// Maximum file size: 5MB / Maksimum fayl ölçüsü: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types / İcazə verilən şəkil tipləri
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * POST /api/seller/user-sellers/[id]/avatar
 * Upload user seller avatar image / İstifadəçi satıcı avatar şəkil yüklə
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const userId = params.id;
    const actualSellerId = await getActualSellerId(session.user.id);

    // Check if user is authorized to update this user seller's avatar
    // İstifadəçinin bu user seller avatar-ını yeniləmək üçün icazəsi olub-olmadığını yoxla
    const userSeller = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        superSellerId: true,
        role: true,
      },
    });

    if (!userSeller) {
      return NextResponse.json(
        { error: "User seller not found / İstifadəçi satıcı tapılmadı" },
        { status: 404 }
      );
    }

    // Only the user seller themselves or their super seller can update avatar
    // Yalnız user seller özü və ya onun super seller-i avatar-ı yeniləyə bilər
    if (userSeller.id !== session.user.id && userSeller.superSellerId !== actualSellerId) {
      return NextResponse.json(
        { error: "Forbidden / Qadağan" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided / Fayl təmin edilməyib" },
        { status: 400 }
      );
    }

    // Validate file type / Fayl tipini yoxla
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and WEBP are allowed / Yanlış fayl tipi. Yalnız JPG, PNG və WEBP icazə verilir" },
        { status: 400 }
      );
    }

    // Validate file size / Fayl ölçüsünü yoxla
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 5MB / Fayl çox böyükdür. Maksimum ölçü 5MB-dır" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist / Əgər yoxdursa uploads qovluğunu yarat
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename / Unikal fayl adı yarat
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `${userId}-${timestamp}-${randomString}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save / Faylı buffer-a çevir və saxla
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL / Public URL yarat
    const publicUrl = `/uploads/avatars/${filename}`;

    // Update user's image in database / Veritabanında istifadəçinin şəklini yenilə
    let updatedUser;
    try {
      updatedUser = await db.user.update({
        where: { id: userId },
        data: { image: publicUrl },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'POST user seller avatar upload');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      updatedUser = await db.user.update({
        where: { id: userId },
        data: { image: publicUrl },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully / Avatar uğurla yükləndi",
      imageUrl: publicUrl,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.image,
      },
    });

  } catch (error: any) {
    console.error("Error uploading user seller avatar / İstifadəçi satıcı avatar yükləmə xətası:", error);
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
 * DELETE /api/seller/user-sellers/[id]/avatar
 * Remove user seller avatar image / İstifadəçi satıcı avatar şəklini sil
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const userId = params.id;
    const actualSellerId = await getActualSellerId(session.user.id);

    // Check if user is authorized to remove this user seller's avatar
    // İstifadəçinin bu user seller avatar-ını silmək üçün icazəsi olub-olmadığını yoxla
    const userSeller = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        superSellerId: true,
        role: true,
      },
    });

    if (!userSeller) {
      return NextResponse.json(
        { error: "User seller not found / İstifadəçi satıcı tapılmadı" },
        { status: 404 }
      );
    }

    // Only the user seller themselves or their super seller can remove avatar
    // Yalnız user seller özü və ya onun super seller-i avatar-ı silə bilər
    if (userSeller.id !== session.user.id && userSeller.superSellerId !== actualSellerId) {
      return NextResponse.json(
        { error: "Forbidden / Qadağan" },
        { status: 403 }
      );
    }

    // Update user's image to null in database / Veritabanında istifadəçinin şəklini null-a yenilə
    let updatedUser;
    try {
      updatedUser = await db.user.update({
        where: { id: userId },
        data: { image: null },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
    } catch (error: any) {
      const errorResponse = await handleDatabaseError(error, 'DELETE user seller avatar');
      if (errorResponse) return errorResponse;

      // Retry after reconnect / Yenidən bağlandıqdan sonra yenidən cəhd et
      updatedUser = await db.user.update({
        where: { id: userId },
        data: { image: null },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Avatar removed successfully / Avatar uğurla silindi",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.image,
      },
    });

  } catch (error: any) {
    console.error("Error removing user seller avatar / İstifadəçi satıcı avatar silmə xətası:", error);
    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to handle database connection errors
// Veritabanı bağlantı xətalarını idarə etmək üçün köməkçi funksiya

