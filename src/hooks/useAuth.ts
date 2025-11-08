/**
 * useAuth Hook / useAuth Hook-u
 * This hook provides authentication state using NextAuth session
 * Bu hook NextAuth session istifadə edərək autentifikasiya vəziyyətini təmin edir
 */

"use client";

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading: status === "loading",
  };
}
