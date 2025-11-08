/**
 * Cookie Management for Locale
 * Dil üçün Cookie İdarəetməsi
 */

export type Locale = 'az' | 'en' | 'zh' | 'ru' | 'tr';

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days / 30 gün

/**
 * Client-side cookie management (for LanguageSwitcher and client components)
 * Client-side cookie idarəetməsi (LanguageSwitcher və client komponentlər üçün)
 */
export function setLocaleCookieClient(locale: Locale): void {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + LOCALE_COOKIE_MAX_AGE * 1000);
  
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getLocaleCookieClient(): Locale | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const localeCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${LOCALE_COOKIE_NAME}=`)
  );
  
  if (localeCookie) {
    const locale = localeCookie.split('=')[1].trim();
    if (['az', 'en', 'zh', 'ru', 'tr'].includes(locale)) {
      return locale as Locale;
    }
  }
  
  return null;
}

/**
 * Server-side cookie management (for Server Components and API routes)
 * Server-side cookie idarəetməsi (Server Component-lər və API route-lar üçün)
 * Note: These functions should only be used in Server Components or API routes
 * Qeyd: Bu funksiyalar yalnız Server Component-lərdə və ya API route-larda istifadə edilməlidir
 */
export async function getLocaleCookie(): Promise<Locale | null> {
  try {
    // Dynamic import to avoid build errors in client components
    // Client komponentlərdə build xətalarını qarşısını almaq üçün dinamik import
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    
    if (locale && ['az', 'en', 'zh', 'ru', 'tr'].includes(locale)) {
      return locale as Locale;
    }
    
    return null;
  } catch (error) {
    // If running in client context, return null
    // Client kontekstdə işləyirsə, null qaytar
    console.error('Error getting locale cookie:', error);
    return null;
  }
}

export async function setLocaleCookie(locale: Locale): Promise<void> {
  try {
    // Dynamic import to avoid build errors in client components
    // Client komponentlərdə build xətalarını qarşısını almaq üçün dinamik import
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE_NAME, locale, {
      maxAge: LOCALE_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // Allow client-side access for LanguageSwitcher
    });
  } catch (error) {
    // If running in client context, use client-side function
    // Client kontekstdə işləyirsə, client-side funksiyadan istifadə et
    console.error('Error setting locale cookie:', error);
    if (typeof document !== 'undefined') {
      setLocaleCookieClient(locale);
    }
  }
}
