"use client";

import { usePathname } from "next/navigation";
import SellerNavigation from "./SellerNavigation";

/**
 * ConditionalLayout Component / Şərti Layout Komponenti
 * 
 * Bu komponent auth səhifələrində sidebar göstərmir,
 * digər səhifələrdə isə SellerNavigation göstərir.
 * 
 * Features / Xüsusiyyətlər:
 * - Auth pages without sidebar / Auth səhifələri sidebar olmadan
 * - Dashboard pages with sidebar / Dashboard səhifələri sidebar ilə
 * - Responsive design / Responsive dizayn
 */

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current page is auth page / Cari səhifənin auth səhifəsi olub-olmadığını yoxla
  const isAuthPage = pathname?.startsWith('/auth');
  
  if (isAuthPage) {
    // Auth pages without sidebar / Auth səhifələri sidebar olmadan
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {children}
      </div>
    );
  }
  
  // Dashboard pages with sidebar / Dashboard səhifələri sidebar ilə
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Seller Navigation / Seller Naviqasiya */}
      <SellerNavigation />
      
      {/* Main Content / Əsas Məzmun */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        {children}
      </main>
    </div>
  );
}
