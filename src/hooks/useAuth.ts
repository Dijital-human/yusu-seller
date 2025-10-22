/**
 * Authentication Hook / Autentifikasiya Hook-u
 * This hook provides authentication state and methods
 * Bu hook autentifikasiya vəziyyətini və metodlarını təmin edir
 */

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@/types";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user = session?.user;

  // Redirect to login if not authenticated / Əgər autentifikasiya olunmayıbsa giriş səhifəsinə yönləndir
  const requireAuth = (redirectTo: string = "/auth/signin") => {
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }
    }, [isLoading, isAuthenticated, router, redirectTo]);
  };

  // Check if user has specific role / İstifadəçinin müəyyən rolu var mı yoxla
  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user?.role) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role as UserRole);
    }
    
    return user.role === role;
  };

  // Check if user is admin / İstifadəçi admin-dir mi yoxla
  const isAdmin = () => hasRole("ADMIN");

  // Check if user is seller / İstifadəçi satıcıdır mı yoxla
  const isSeller = () => hasRole("SELLER");

  // Check if user is courier / İstifadəçi kuryerdir mı yoxla
  const isCourier = () => hasRole("COURIER");

  // Check if user is customer / İstifadəçi müştəridir mı yoxla
  const isCustomer = () => hasRole("CUSTOMER");

  // Sign in with provider / Provayder ilə giriş et
  const signInWithProvider = (provider: string, callbackUrl?: string) => {
    signIn(provider, { callbackUrl: callbackUrl || "/" });
  };

  // Sign in with credentials / Kimlik bilgiləri ilə giriş et
  const signInWithCredentials = (email: string, password: string, callbackUrl?: string) => {
    signIn("credentials", {
      email,
      password,
      callbackUrl: callbackUrl || "/",
      redirect: false,
    });
  };

  // Sign out / Çıxış et
  const handleSignOut = (callbackUrl?: string) => {
    signOut({ callbackUrl: callbackUrl || "/" });
  };

  return {
    // State / Vəziyyət
    user,
    session,
    isLoading,
    isAuthenticated,
    
    // Methods / Metodlar
    requireAuth,
    hasRole,
    isAdmin,
    isSeller,
    isCourier,
    isCustomer,
    signInWithProvider,
    signInWithCredentials,
    handleSignOut,
  };
}
