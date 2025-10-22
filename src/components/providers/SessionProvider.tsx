/**
 * Session Provider Wrapper / Sessiya Provayder Wrapper-i
 * This component wraps the app with NextAuth SessionProvider
 * Bu komponent tətbiqi NextAuth SessionProvider ilə sarıyır
 */

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
