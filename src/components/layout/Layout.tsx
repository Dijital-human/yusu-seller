/**
 * Main Layout Component / Əsas Layout Komponenti
 * This component wraps the entire application with header and footer
 * Bu komponent bütün tətbiqi başlıq və altlıqla sarıyır
 */

import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
