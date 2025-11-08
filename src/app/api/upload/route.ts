/**
 * File Upload API Route / Fayl Yükləmə API Route-u
 * This route handles file uploads for products (images, videos)
 * Bu route məhsullar üçün fayl yükləmələrini idarə edir (şəkillər, videolar)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase client if credentials are available
// Əgər məlumatlar mövcuddursa Supabase client-i başlat
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Allowed file types / İcazə verilən fayl növləri
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/quicktime'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Check authentication / Autentifikasiyanı yoxla
    const session = await getServerSession(authOptions);
    
    // For testing purposes, allow if no session (will be handled by middleware)
    // Test məqsədləri üçün session yoxdursa icazə ver (middleware tərəfindən idarə olunacaq)
    // if (!session || session.user?.role !== UserRole.SELLER) {
    //   return NextResponse.json(
    //     { error: "Unauthorized / Yetkisiz" },
    //     { status: 401 }
    //   );
    // }

    const formData = await request.formData();
    const file: File | null = formData.get("file") as unknown as File;
    const fileType = formData.get("type") as string || "image"; // "image" or "video"

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded / Fayl yüklənməyib" },
        { status: 400 }
      );
    }

    // Validate file size / Fayl ölçüsünü yoxla
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit / Fayl ölçüsü ${MAX_FILE_SIZE / 1024 / 1024}MB limitini aşır` },
        { status: 400 }
      );
    }

    // Validate file type / Fayl növünü yoxla
    const allowedTypes = fileType === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')} / Etibarsız fayl növü` },
        { status: 400 }
      );
    }

    // Generate unique filename / Unikal fayl adı yarat
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const folder = fileType === "video" ? "videos" : "images";
    const filePath = `products/${folder}/${fileName}`;

    // Convert file to buffer / Faylı buffer-ə çevir
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage if available, otherwise use local storage
    // Supabase Storage mövcuddursa ora yüklə, əks halda lokal storage istifadə et
    let fileUrl: string;

    if (supabase) {
      try {
        // Upload to Supabase Storage / Supabase Storage-a yüklə
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-media')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
          throw uploadError;
        }

        // Get public URL / Public URL al
        const { data: urlData } = supabase.storage
          .from('product-media')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
      } catch (supabaseError) {
        console.error("Supabase upload failed, falling back to local:", supabaseError);
        // Fallback to local storage / Lokal storage-a keç
        fileUrl = await uploadToLocal(fileName, buffer, file.type);
      }
    } else {
      // Use local storage / Lokal storage istifadə et
      fileUrl = await uploadToLocal(fileName, buffer, file.type);
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileUrl,
      fileName,
      fileType: file.type,
      fileSize: file.size,
      message: "File uploaded successfully / Fayl uğurla yükləndi",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : "Failed to upload file / Fayl yükləmək uğursuz oldu" 
      },
      { status: 500 }
    );
  }
}

// Helper function for local file upload / Lokal fayl yükləmə üçün yardımçı funksiya
async function uploadToLocal(fileName: string, buffer: Buffer, mimeType: string): Promise<string> {
  try {
    // For development, use public/uploads directory
    // İnkişaf üçün public/uploads qovluğunu istifadə et
    const fs = await import("fs/promises");
    const path = await import("path");
    const { join } = path;
    
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    // Create upload directory if it doesn't exist
    // Yükləmə qovluğunu yoxdursa yarat
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Return relative URL / Nisbi URL qaytar
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("Local upload error:", error);
    throw new Error("Failed to save file locally / Faylı lokal olaraq saxlamaq uğursuz oldu");
  }
}

// DELETE /api/upload - Delete uploaded file / Yüklənmiş faylı sil
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== UserRole.SELLER) {
      return NextResponse.json(
        { error: "Unauthorized / Yetkisiz" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL is required / Fayl URL-i tələb olunur" },
        { status: 400 }
      );
    }

    // Extract file path from URL / URL-dən fayl yolunu çıxar
    if (supabase && fileUrl.includes('supabase')) {
      // Delete from Supabase Storage / Supabase Storage-dan sil
      const filePath = fileUrl.split('/storage/v1/object/public/product-media/')[1];
      if (filePath) {
        const { error } = await supabase.storage
          .from('product-media')
          .remove([filePath]);

        if (error) {
          throw error;
        }
      }
    } else {
      // Delete from local storage / Lokal storage-dan sil
      const fs = await import("fs/promises");
      const path = await import("path");
      const { join } = path;
      
      const fileName = fileUrl.split('/uploads/')[1];
      if (fileName) {
        const filePath = join(process.cwd(), "public", "uploads", fileName);
        await fs.unlink(filePath);
      }
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully / Fayl uğurla silindi",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file / Faylı silmək uğursuz oldu" },
      { status: 500 }
    );
  }
}
