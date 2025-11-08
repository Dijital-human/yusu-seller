/**
 * Database Utility Functions / Veritabanı Faydalı Funksiyaları
 * This file contains common database utility functions used throughout the application
 * Bu fayl tətbiq boyunca istifadə olunan ümumi veritabanı faydalı funksiyaları ehtiva edir
 */

import { NextResponse } from "next/server";
import { reconnectDatabase } from "@/lib/db";

/**
 * Handle database connection errors with retry logic
 * Retry logic ilə veritabanı bağlantı xətalarını idarə et
 * 
 * @param error - The error object / Xəta obyekti
 * @param operation - The operation name for logging / Logging üçün əməliyyat adı
 * @returns NextResponse if error should be returned, null if retry should be attempted
 * Xəta qaytarılmalıdırsa NextResponse, yenidən cəhd edilməlidirsə null
 */
export async function handleDatabaseError(
  error: any,
  operation: string
): Promise<NextResponse | null> {
  if (error?.message?.includes('Closed') || error?.code === 'P1001') {
    console.log(
      `🔄 Database connection closed during ${operation}, attempting reconnect... / ${operation} zamanı veritabanı bağlantısı bağlandı, yenidən bağlanma cəhdi...`
    );
    const reconnected = await reconnectDatabase();
    if (reconnected) {
      return null; // Retry the operation / Əməliyyatı yenidən cəhd et
    }
  }
  return NextResponse.json(
    {
      error: `Database error during ${operation} / ${operation} zamanı veritabanı xətası: ${
        error?.message || 'Unknown error / Naməlum xəta'
      }`,
    },
    { status: 500 }
  );
}

