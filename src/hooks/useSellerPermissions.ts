/**
 * Seller Permissions Hook / Satıcı İcazələri Hook-u
 * This hook provides seller-specific permission checking
 * Bu hook satıcı xüsusi icazə yoxlaması təmin edir
 */

"use client";

import { useSession } from "next-auth/react";

interface SellerPermission {
  viewPurchasePrice: boolean;
  publishProducts: boolean;
  unpublishProducts: boolean;
  manageUserSellers: boolean;
  manageWarehouse: boolean;
  useBarcode: boolean;
  usePOS: boolean;
  manageStorage: boolean;
  manageOrders?: boolean; // Sifarişləri idarə etmə icazəsi / Permission to manage orders
  viewAnalytics?: boolean; // Analitikaya baxma icazəsi / Permission to view analytics
  manageMarketing?: boolean; // Marketinq idarəetməsi / Permission to manage marketing
}

export function useSellerPermissions() {
  const { data: session } = useSession();
  const user = session?.user;
  const isAuthenticated = !!user;

  // Check if user is Super Seller / İstifadəçinin Super Seller olub-olmadığını yoxla
  const isSuperSeller = (): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.role === "SUPER_SELLER" || (user.role === "SELLER" && (user as any).sellerType === "SUPER_SELLER");
  };

  // Check if user is User Seller / İstifadəçinin User Seller olub-olmadığını yoxla
  const isUserSeller = (): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.role === "USER_SELLER" || (user.role === "SELLER" && (user as any).sellerType === "USER_SELLER");
  };

  // Get seller permissions from user object / İstifadəçi obyektindən satıcı icazələrini al
  const getSellerPermissions = (): SellerPermission | null => {
    if (!isAuthenticated || !user) return null;

    // Admin has all permissions / Admin bütün icazələrə malikdir
    if (user.role === "ADMIN") {
      return {
        viewPurchasePrice: true,
        publishProducts: true,
        unpublishProducts: true,
        manageUserSellers: true,
        manageWarehouse: true,
        useBarcode: true,
        usePOS: true,
        manageStorage: true,
        manageOrders: true,
        viewAnalytics: true,
        manageMarketing: true,
      };
    }

    // Super Seller has all permissions except admin-specific ones / Super Seller admin xüsusi olanlar istisna olmaqla bütün icazələrə malikdir
    if (isSuperSeller()) {
      return {
        viewPurchasePrice: true,
        publishProducts: true,
        unpublishProducts: true,
        manageUserSellers: true,
        manageWarehouse: true,
        useBarcode: true,
        usePOS: true,
        manageStorage: true,
        manageOrders: true,
        viewAnalytics: true,
        manageMarketing: true,
      };
    }

    // User Seller permissions come from sellerPermissions JSON / User Seller icazələri sellerPermissions JSON-dan gəlir
    if (isUserSeller()) {
      try {
        const permissions = (user as any).sellerPermissions 
          ? JSON.parse((user as any).sellerPermissions) 
          : {};
        
        return {
          viewPurchasePrice: permissions.viewPurchasePrice ?? false,
          publishProducts: permissions.publishProducts ?? false,
          unpublishProducts: permissions.unpublishProducts ?? false,
          manageUserSellers: false, // User Sellers cannot manage other User Sellers / User Seller-lər digər User Seller-ləri idarə edə bilməz
          manageWarehouse: permissions.manageWarehouse ?? false,
          useBarcode: permissions.useBarcode ?? true, // Default true / Varsayılan true
          usePOS: permissions.usePOS ?? true, // Default true / Varsayılan true
          manageStorage: false, // Only Super Seller can manage storage / Yalnız Super Seller storage idarə edə bilər
          manageOrders: permissions.manageOrders ?? false,
          viewAnalytics: permissions.viewAnalytics ?? false,
          manageMarketing: permissions.manageMarketing ?? false,
        };
      } catch (error) {
        console.error("Error parsing seller permissions:", error);
        return null;
      }
    }

    return null;
  };

  // Check if user has specific seller permission / İstifadəçinin müəyyən satıcı icazəsi var mı yoxla
  const hasSellerPermission = (permission: keyof SellerPermission): boolean => {
    const permissions = getSellerPermissions();
    if (!permissions) return false;
    return permissions[permission] ?? false;
  };

  // Check if user can view purchase price / İstifadəçinin alış qiymətini görə biləcəyini yoxla
  const canViewPurchasePrice = (): boolean => {
    return hasSellerPermission("viewPurchasePrice");
  };

  // Check if user can publish products / İstifadəçinin məhsul yayımlaya biləcəyini yoxla
  const canPublishProducts = (): boolean => {
    return hasSellerPermission("publishProducts");
  };

  // Check if user can unpublish products / İstifadəçinin məhsulu yayımdan çıxara biləcəyini yoxla
  const canUnpublishProducts = (): boolean => {
    return hasSellerPermission("unpublishProducts");
  };

  // Check if user can manage User Sellers / İstifadəçinin User Seller-ləri idarə edə biləcəyini yoxla
  const canManageUserSellers = (): boolean => {
    return hasSellerPermission("manageUserSellers");
  };

  // Check if user can manage warehouse / İstifadəçinin anbarı idarə edə biləcəyini yoxla
  const canManageWarehouse = (): boolean => {
    return hasSellerPermission("manageWarehouse");
  };

  // Check if user can use barcode / İstifadəçinin barkod istifadə edə biləcəyini yoxla
  const canUseBarcode = (): boolean => {
    return hasSellerPermission("useBarcode");
  };

  // Check if user can use POS / İstifadəçinin POS istifadə edə biləcəyini yoxla
  const canUsePOS = (): boolean => {
    return hasSellerPermission("usePOS");
  };

  // Check if user can manage storage / İstifadəçinin storage idarə edə biləcəyini yoxla
  const canManageStorage = (): boolean => {
    return hasSellerPermission("manageStorage");
  };

  // Check if user can manage orders / İstifadəçinin sifarişləri idarə edə biləcəyini yoxla
  const canManageOrders = (): boolean => {
    return hasSellerPermission("manageOrders");
  };

  // Check if user can view analytics / İstifadəçinin analitikaya baxa biləcəyini yoxla
  const canViewAnalytics = (): boolean => {
    return hasSellerPermission("viewAnalytics");
  };

  // Check if user can manage marketing / İstifadəçinin marketinqi idarə edə biləcəyini yoxla
  const canManageMarketing = (): boolean => {
    return hasSellerPermission("manageMarketing");
  };

  return {
    isSuperSeller,
    isUserSeller,
    getSellerPermissions,
    hasSellerPermission,
    canViewPurchasePrice,
    canPublishProducts,
    canUnpublishProducts,
    canManageUserSellers,
    canManageWarehouse,
    canUseBarcode,
    canUsePOS,
    canManageStorage,
    canManageOrders,
    canViewAnalytics,
    canManageMarketing,
  };
}

