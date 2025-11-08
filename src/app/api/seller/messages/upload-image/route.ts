/**
 * Message Image Upload API Route / Mesaj Şəkil Yükləmə API Route-u
 * This route handles image uploads for seller messages
 * Bu route satıcı mesajları üçün şəkil yükləmələrini idarə edir
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { validateImageFile } from "@/lib/message-helpers";
import { getActualSellerId } from "@/lib/warehouse-access";
import { handleDatabaseError } from "@/lib/db-utils";

/**
 * POST /api/seller/messages/upload-image
 * Upload image for message / Mesaj üçün şəkil yüklə
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { 
          error: "Unauthorized / Yetkisiz",
          errorAz: "Yetkisiz"
        },
        { status: 401 }
      );
    }

    // Get actual seller ID (for User Seller support) / Həqiqi seller ID-ni al (User Seller dəstəyi üçün)
    // Note: User Sellers can also upload images for messages
    // Qeyd: User Seller-lər də mesajlar üçün şəkil yükləyə bilər
    try {
      await getActualSellerId(session.user.id);
    } catch (error: any) {
      console.error("Error getting actual seller ID:", error);
      // Continue anyway - any authenticated seller can upload images
      // Hər halda davam et - hər hansı autentifikasiya edilmiş satıcı şəkil yükləyə bilər
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { 
          error: "No file provided / Fayl təmin edilməyib",
          errorAz: "Fayl təmin edilməyib"
        },
        { status: 400 }
      );
    }

    // Validate image file / Şəkil faylını yoxla
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: validation.error || "Invalid image file / Etibarsız şəkil faylı",
          errorAz: validation.error || "Etibarsız şəkil faylı"
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist / Əgər yoxdursa uploads qovluğunu yarat
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'messages');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename / Unikal fayl adı yarat
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `${session.user.id}-${timestamp}-${randomString}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save / Faylı buffer-a çevir və saxla
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL / Public URL yarat
    const publicUrl = `/uploads/messages/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    
    // Handle file system errors / Fayl sistemi xətalarını idarə et
    if (error?.code === 'ENOENT' || error?.code === 'EACCES') {
      return NextResponse.json(
        { 
          error: "File system error. Please try again. / Fayl sistemi xətası. Zəhmət olmasa yenidən cəhd edin.",
          errorAz: "Fayl sistemi xətası. Zəhmət olmasa yenidən cəhd edin."
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "Internal server error / Daxili server xətası",
        errorAz: "Daxili server xətası",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

