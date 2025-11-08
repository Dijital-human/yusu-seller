import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";

export const metadata: Metadata = {
  title: "Yusu Seller Panel - Satıcı Paneli",
  description: "Yusu Seller Panel - Məhsullarınızı idarə edin və satışlarınızı artırın. / Manage your products and increase your sales.",
  keywords: "seller, satıcı, seller panel, satıcı paneli, product management, məhsul idarəetməsi, ecommerce",
  authors: [{ name: "Yusu Seller Team" }],
  openGraph: {
    title: "Yusu Seller Panel - Satıcı Paneli",
    description: "Məhsullarınızı idarə edin və satışlarınızı artırın. / Manage your products and increase your sales.",
    type: "website",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  // Gələn `locale`-in etibarlı olduğundan əmin ol
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // Bütün mesajları client-ə təmin etmək
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <body className="font-sans antialiased h-full bg-gray-50" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}


