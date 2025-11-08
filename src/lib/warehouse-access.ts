/**
 * Warehouse Access Helper Functions / Anbar Girişi Köməkçi Funksiyaları
 * Helper functions for determining warehouse access for Super Sellers and User Sellers
 * Super Seller və User Seller-lər üçün anbar girişini müəyyən etmək üçün köməkçi funksiyalar
 */

import { db } from "@/lib/db";

/**
 * Get actual seller ID for warehouse access
 * User Seller-dirsə Super Seller ID qaytarır, Super Seller-dirsə öz ID-sini qaytarır
 * Anbar girişi üçün həqiqi seller ID-ni al
 * 
 * @param userId - Current user ID / Cari istifadəçi ID
 * @returns Actual seller ID (Super Seller ID for User Sellers) / Həqiqi seller ID (User Seller-lər üçün Super Seller ID)
 */
export async function getActualSellerId(userId: string): Promise<{ actualSellerId: string; isUserSeller: boolean; userRole: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        sellerType: true,
        superSellerId: true,
      },
    });

    if (!user) {
      throw new Error("User not found / İstifadəçi tapılmadı");
    }

    // Check if user is User Seller / İstifadəçinin User Seller olub-olmadığını yoxla
    const isUserSeller = user.role === "USER_SELLER" || user.sellerType === "USER_SELLER";

    if (isUserSeller) {
      // User Seller can only access Super Seller's warehouses
      // User Seller yalnız Super Seller-in anbarlarına giriş edə bilər
      if (!user.superSellerId) {
        throw new Error("User Seller must be linked to Super Seller / User Seller Super Seller-ə bağlı olmalıdır");
      }
      return {
        actualSellerId: user.superSellerId,
        isUserSeller: true,
        userRole: user.role || user.sellerType || "USER_SELLER",
      };
    }

    // Super Seller uses own ID / Super Seller öz ID-sini istifadə edir
    return {
      actualSellerId: user.id,
      isUserSeller: false,
      userRole: user.role || user.sellerType || "SUPER_SELLER",
    };
  } catch (error) {
    console.error("Error getting actual seller ID:", error);
    throw error;
  }
}

/**
 * Check if user can create warehouses
 * İstifadəçinin anbar yarada biləcəyini yoxla
 * Only Super Sellers and Admins can create warehouses
 * Yalnız Super Seller-lər və Admin-lər anbar yarada bilər
 * 
 * @param userId - Current user ID / Cari istifadəçi ID
 * @returns true if user can create warehouses / İstifadəçi anbar yarada bilərsə true
 */
export async function canCreateWarehouse(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        sellerType: true,
      },
    });

    if (!user) {
      return false;
    }

    const isSuperSeller = user.role === "SUPER_SELLER" || user.sellerType === "SUPER_SELLER";
    const isAdmin = user.role === "ADMIN";

    return isSuperSeller || isAdmin;
  } catch (error) {
    console.error("Error checking warehouse creation permission:", error);
    return false;
  }
}

/**
 * Check if user has manageWarehouse permission
 * İstifadəçinin manageWarehouse icazəsi olub-olmadığını yoxla
 * Super Sellers always have this permission
 * User Sellers need this permission in their sellerPermissions
 * Super Seller-lər həmişə bu icazəyə malikdir
 * User Seller-lər sellerPermissions-də bu icazəyə ehtiyac duyurlar
 * 
 * @param userId - Current user ID / Cari istifadəçi ID
 * @returns true if user can manage warehouse / İstifadəçi anbarı idarə edə bilərsə true
 */
export async function canManageWarehouse(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        sellerType: true,
        sellerPermissions: true,
      },
    });

    if (!user) {
      return false;
    }

    // Super Sellers always have warehouse management permission
    // Super Seller-lər həmişə anbar idarəetmə icazəsinə malikdir
    const isSuperSeller = user.role === "SUPER_SELLER" || user.sellerType === "SUPER_SELLER";
    if (isSuperSeller) {
      return true;
    }

    // User Sellers need manageWarehouse permission
    // User Seller-lər manageWarehouse icazəsinə ehtiyac duyurlar
    const isUserSeller = user.role === "USER_SELLER" || user.sellerType === "USER_SELLER";
    if (isUserSeller && user.sellerPermissions) {
      try {
        const permissions = JSON.parse(user.sellerPermissions);
        return permissions.manageWarehouse === true;
      } catch (error) {
        console.error("Error parsing seller permissions:", error);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking warehouse management permission:", error);
    return false;
  }
}

