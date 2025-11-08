/**
 * Message Helper Functions / Mesaj Köməkçi Funksiyaları
 * Helper functions for seller messages to admin
 * Adminə satıcı mesajları üçün köməkçi funksiyalar
 */

import { db, reconnectDatabase } from "@/lib/db";

// Maximum file size: 5MB / Maksimum fayl ölçüsü: 5MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Allowed image types / İcazə verilən şəkil tipləri
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Maximum images per message / Mesaj başına maksimum şəkil sayı
export const MAX_IMAGES_PER_MESSAGE = 5;

/**
 * Validate image file / Şəkil faylını yoxla
 * @param file - Image file to validate / Yoxlanılacaq şəkil faylı
 * @returns Validation result / Yoxlama nəticəsi
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type / Fayl tipini yoxla
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid image format (only JPG, PNG, WEBP) / Yanlış şəkil formatı (yalnız JPG, PNG, WEBP)"
    };
  }

  // Check file size / Fayl ölçüsünü yoxla
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: "Image is too large (maximum 5MB) / Şəkil çox böyükdür (maksimum 5MB)"
    };
  }

  return { valid: true };
}

/**
 * Get seller messages with retry logic / Retry logic ilə satıcı mesajlarını al
 * @param sellerId - Seller ID / Satıcı ID
 * @param page - Page number / Səhifə nömrəsi
 * @param limit - Items per page / Səhifə başına element sayı
 * @returns Messages and pagination info / Mesajlar və pagination məlumatı
 */
export async function getSellerMessages(sellerId: string, page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;
    
    const messages = await db.sellerMessage.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      skip,
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

    const total = await db.sellerMessage.count({
      where: { sellerId },
    });

    return { messages, total, pages: Math.ceil(total / limit) };
  } catch (error: any) {
    if (error?.message?.includes('Closed') || error?.code === 'P1001') {
      await reconnectDatabase();
      return getSellerMessages(sellerId, page, limit);
    }
    throw error;
  }
}

