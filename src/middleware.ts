/**
 * Middleware for Role-based Access Control and i18n / Rol əsaslı Giriş Nəzarəti və i18n üçün Middleware
 * This middleware protects routes based on user roles and handles internationalization
 * Bu middleware istifadəçi rollarına əsasən route-ları qoruyur və beynəlxalqlaşdırmayı idarə edir
 */

import createMiddleware from 'next-intl/middleware';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@prisma/client";
import { routing } from './i18n/routing';
import { getDefaultLocale } from './lib/region-detection';

// Create next-intl middleware / next-intl middleware yarat
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip .well-known paths (Chrome DevTools, etc.) / .well-known path-lərini keç (Chrome DevTools və s.)
  if (pathname.includes('/.well-known/')) {
    return NextResponse.next();
  }

  // Check for locale in pathname / Pathname-də dil yoxla
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale in pathname, detect and redirect / Pathname-də dil yoxdursa, aşkarla və yönləndir
  if (!pathnameHasLocale && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    // Check cookie first (from request headers) / Əvvəlcə cookie yoxla (request header-lərindən)
    const cookieHeader = request.cookies.get('NEXT_LOCALE')?.value;
    let locale = cookieHeader && ['az', 'en', 'zh', 'ru', 'tr'].includes(cookieHeader) 
      ? cookieHeader as any 
      : null;
    
    // If no cookie, detect from headers / Cookie yoxdursa, header-lərdən aşkarla
    if (!locale) {
      const acceptLanguage = request.headers.get('accept-language');
      const countryCode = request.headers.get('x-vercel-ip-country') || 
                         request.headers.get('cf-ipcountry') || 
                         null;
      
      locale = await getDefaultLocale(acceptLanguage, countryCode);
    }

    // Redirect to locale path / Dil yoluna yönləndir
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Handle i18n routing / i18n routing-i idarə et
  const response = intlMiddleware(request);

  // Public routes that don't require authentication / Autentifikasiya tələb etməyən ictimai route-lar
  const publicRoutes = [
    "/",
    "/auth/signin",
    "/auth/signup", 
    "/auth/error",
    "/unauthorized"
  ];

  // Extract locale from pathname / Pathname-dən dil çıxar
  const locale = routing.locales.find(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  ) || routing.defaultLocale;

  // Remove locale from pathname for route checking / Route yoxlaması üçün pathname-dən dili çıxar
  const pathnameWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // Check if route is public / Route-un ictimai olub-olmadığını yoxla
  if (publicRoutes.some(route => pathnameWithoutLocale.startsWith(route))) {
    return response;
  }

  // Seller routes protection / Seller route-larının qorunması
  if (pathnameWithoutLocale.startsWith('/seller')) {
    try {
      // Get JWT token from NextAuth / NextAuth-dan JWT token al
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET 
      });

      // Check if user is authenticated / İstifadəçinin autentifikasiya edilib-edilmədiyini yoxla
      if (!token) {
        const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Check if user has SELLER role / İstifadəçinin SELLER rolu olub-olmadığını yoxla
      if (token.role !== UserRole.SELLER) {
        return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
      }

      // Check if seller is approved / Satıcının təsdiqlənib-təsdiqlənmədiyini yoxla
      if (!token.isApproved) {
        const pendingUrl = new URL(`/${locale}/pending-approval`, request.url);
        return NextResponse.redirect(pendingUrl);
      }

      // User is authenticated, has SELLER role, and is approved / İstifadəçi autentifikasiya edilib, SELLER rolu var və təsdiqlənib
      return response;
    } catch (error) {
      console.error('Middleware authentication error:', error);
      // On error, redirect to sign in / Xəta olduqda giriş səhifəsinə yönləndir
      return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url));
    }
  }

  // For other routes, allow access / Digər route-lar üçün girişə icazə ver
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
