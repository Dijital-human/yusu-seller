/**
 * Permission Helpers / İcazə Köməkçiləri
 * Helper functions for permission display and management
 * İcazə göstərmə və idarəetmə üçün köməkçi funksiyalar
 */

import { 
  Package, 
  Warehouse, 
  Scan, 
  ShoppingCart, 
  BarChart, 
  Target, 
  Eye, 
  Zap 
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// Permission configuration / İcazə konfiqurasiyası
export interface PermissionConfig {
  key: string;
  icon: LucideIcon;
  labelKey: string;
  category: 'product' | 'warehouse' | 'sales' | 'marketing';
  categoryLabelKey: string;
}

// Permission configurations / İcazə konfiqurasiyaları
export const permissionConfigs: PermissionConfig[] = [
  {
    key: 'viewPurchasePrice',
    icon: Eye,
    labelKey: 'viewPurchasePrice',
    category: 'product',
    categoryLabelKey: 'productManagement',
  },
  {
    key: 'publishProducts',
    icon: Package,
    labelKey: 'publishProducts',
    category: 'product',
    categoryLabelKey: 'productManagement',
  },
  {
    key: 'manageWarehouse',
    icon: Warehouse,
    labelKey: 'manageWarehouse',
    category: 'warehouse',
    categoryLabelKey: 'warehouseTools',
  },
  {
    key: 'useBarcode',
    icon: Scan,
    labelKey: 'useBarcode',
    category: 'warehouse',
    categoryLabelKey: 'warehouseTools',
  },
  {
    key: 'usePOS',
    icon: Zap,
    labelKey: 'usePOS',
    category: 'warehouse',
    categoryLabelKey: 'warehouseTools',
  },
  {
    key: 'manageOrders',
    icon: ShoppingCart,
    labelKey: 'manageOrders',
    category: 'sales',
    categoryLabelKey: 'salesAnalytics',
  },
  {
    key: 'viewAnalytics',
    icon: BarChart,
    labelKey: 'viewAnalytics',
    category: 'sales',
    categoryLabelKey: 'salesAnalytics',
  },
  {
    key: 'manageMarketing',
    icon: Target,
    labelKey: 'manageMarketing',
    category: 'marketing',
    categoryLabelKey: 'marketing',
  },
];

/**
 * Get permission config by key / Açar ilə icazə konfiqurasiyasını al
 */
export function getPermissionConfig(key: string): PermissionConfig | undefined {
  return permissionConfigs.find(p => p.key === key);
}

/**
 * Get permissions grouped by category / İcazələri kateqoriyaya görə qruplaşdır
 */
export function getPermissionsByCategory(permissions: Record<string, boolean>): Record<string, PermissionConfig[]> {
  const grouped: Record<string, PermissionConfig[]> = {
    product: [],
    warehouse: [],
    sales: [],
    marketing: [],
  };

  Object.entries(permissions).forEach(([key, value]) => {
    const config = getPermissionConfig(key);
    if (config) {
      grouped[config.category].push(config);
    }
  });

  return grouped;
}

