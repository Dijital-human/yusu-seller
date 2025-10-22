import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import SellerNavigation from "@/components/layout/SellerNavigation";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
// import { CartProvider } from "@/store/CartContext"; // Removed as not relevant for seller

export const metadata: Metadata = {
  title: "Yusu Seller Panel - Satıcı Paneli",
  description: "Yusu Seller Panel - Məhsullarınızı idarə edin və satışlarınızı artırın. / Manage your products and increase your sales.",
  keywords: "seller, satıcı, seller panel, satıcı paneli, product management, məhsul idarəetməsi, ecommerce",
  authors: [{ name: "Yusu Seller Team" }],
  openGraph: {
    title: "Yusu Seller Panel - Satıcı Paneli",
    description: "Məhsullarınızı idarə edin və satışlarınızı artırın. / Manage your products and increase your sales.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
