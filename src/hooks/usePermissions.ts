/**
 * Permissions Hook / İcazələr Hook-u
 * This hook provides role-based permission checking
 * Bu hook rol əsaslı icazə yoxlaması təmin edir
 */

import { useAuth } from "./useAuth";
import { UserRole } from "@/types";

interface Permission {
  action: string;
  resource: string;
}

export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  // Check if user has specific permission / İstifadəçinin müəyyən icazəsi var mı yoxla
  const hasPermission = (permission: Permission): boolean => {
    if (!isAuthenticated || !user) return false;

    const { action, resource } = permission;

    // Admin has all permissions / Admin bütün icazələrə malikdir
    if (user.role === "ADMIN") return true;

    // Define permissions by role / Rollara görə icazələri təyin et
    const rolePermissions: Record<UserRole, Permission[]> = {
      CUSTOMER: [
        { action: "read", resource: "products" },
        { action: "read", resource: "categories" },
        { action: "create", resource: "orders" },
        { action: "read", resource: "orders" },
        { action: "update", resource: "orders" }, // Only cancel pending orders / Yalnız gözləyən sifarişləri ləğv et
        { action: "read", resource: "profile" },
        { action: "update", resource: "profile" },
        { action: "create", resource: "cart" },
        { action: "read", resource: "cart" },
        { action: "update", resource: "cart" },
        { action: "delete", resource: "cart" },
      ],
      SELLER: [
        { action: "read", resource: "products" },
        { action: "create", resource: "products" },
        { action: "update", resource: "products" },
        { action: "delete", resource: "products" },
        { action: "read", resource: "categories" },
        { action: "read", resource: "orders" },
        { action: "update", resource: "orders" }, // Confirm, ship, cancel their orders / Öz sifarişlərini təsdiqlə, göndər, ləğv et
        { action: "read", resource: "profile" },
        { action: "update", resource: "profile" },
        { action: "read", resource: "dashboard" },
      ],
      COURIER: [
        { action: "read", resource: "orders" },
        { action: "update", resource: "orders" }, // Update delivery status / Çatdırılma statusunu yenilə
        { action: "read", resource: "profile" },
        { action: "update", resource: "profile" },
        { action: "read", resource: "dashboard" },
      ],
      ADMIN: [
        // Admin has all permissions / Admin bütün icazələrə malikdir
        { action: "*", resource: "*" },
      ],
    };

    const userPermissions = rolePermissions[user.role] || [];
    
    return userPermissions.some(perm => 
      (perm.action === "*" && perm.resource === "*") ||
      (perm.action === action && perm.resource === resource)
    );
  };

  // Check if user can perform action on resource / İstifadəçinin resursda əməliyyat edə biləcəyini yoxla
  const can = (action: string, resource: string): boolean => {
    return hasPermission({ action, resource });
  };

  // Check if user can access route / İstifadəçinin route-a daxil ola biləcəyini yoxla
  const canAccess = (route: string): boolean => {
    if (!isAuthenticated || !user) return false;

    // Public routes / İctimai route-lar
    const publicRoutes = [
      "/",
      "/products",
      "/categories",
      "/about",
      "/contact",
      "/auth/signin",
      "/auth/signup",
    ];

    if (publicRoutes.includes(route)) return true;

    // Role-based route access / Rol əsaslı route girişi
    switch (user.role) {
      case "ADMIN":
        return true; // Admin can access all routes / Admin bütün route-lara daxil ola bilər
      case "CUSTOMER":
        return !route.startsWith("/admin") && 
               !route.startsWith("/seller") && 
               !route.startsWith("/courier");
      case "SELLER":
        return !route.startsWith("/admin") && 
               !route.startsWith("/courier");
      case "COURIER":
        return !route.startsWith("/admin") && 
               !route.startsWith("/seller");
      default:
        return false;
    }
  };

  // Check if user can manage specific order / İstifadəçinin müəyyən sifarişi idarə edə biləcəyini yoxla
  const canManageOrder = (order: any): boolean => {
    if (!isAuthenticated || !user) return false;

    // Admin can manage all orders / Admin bütün sifarişləri idarə edə bilər
    if (user.role === "ADMIN") return true;

    // Customer can manage their own orders / Müştəri öz sifarişlərini idarə edə bilər
    if (user.role === "CUSTOMER" && order.customerId === user.id) return true;

    // Seller can manage orders for their products / Satıcı öz məhsulları üçün sifarişləri idarə edə bilər
    if (user.role === "SELLER" && order.sellerId === user.id) return true;

    // Courier can manage assigned orders / Kuryer təyin edilmiş sifarişləri idarə edə bilər
    if (user.role === "COURIER" && order.courierId === user.id) return true;

    return false;
  };

  // Check if user can manage specific product / İstifadəçinin müəyyən məhsulu idarə edə biləcəyini yoxla
  const canManageProduct = (product: any): boolean => {
    if (!isAuthenticated || !user) return false;

    // Admin can manage all products / Admin bütün məhsulları idarə edə bilər
    if (user.role === "ADMIN") return true;

    // Seller can manage their own products / Satıcı öz məhsullarını idarə edə bilər
    if (user.role === "SELLER" && product.sellerId === user.id) return true;

    return false;
  };

  // Get available actions for resource / Resurs üçün mövcud əməliyyatları əldə et
  const getAvailableActions = (resource: string): string[] => {
    if (!isAuthenticated || !user) return [];

    const actions: string[] = [];

    if (can("read", resource)) actions.push("read");
    if (can("create", resource)) actions.push("create");
    if (can("update", resource)) actions.push("update");
    if (can("delete", resource)) actions.push("delete");

    return actions;
  };

  return {
    hasPermission,
    can,
    canAccess,
    canManageOrder,
    canManageProduct,
    getAvailableActions,
  };
}
