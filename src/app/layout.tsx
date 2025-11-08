/**
 * Root Layout - Minimal wrapper
 * Middleware handles locale detection and redirects
 * Middleware dil aşkarlamasını və yönləndirmələri idarə edir
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Middleware will handle locale detection and redirect
  // Middleware dil aşkarlamasını və yönləndirməni idarə edəcək
  // This layout just passes through to [locale]/layout.tsx
  // Bu layout sadəcə [locale]/layout.tsx-ə keçir
  return <>{children}</>;
}
