"use client";

import { usePathname } from "next/navigation";
import SellerNavigation from "./SellerNavigation";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {children}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <SellerNavigation />
      {/* Main content area / Əsas məzmun sahəsi */}
      <main className="flex-1 
        pt-16 lg:pt-16
        overflow-auto
        bg-white
        min-h-screen">
        {children}
      </main>
    </div>
  );
}
