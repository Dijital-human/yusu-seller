/**
 * Region Detection for Automatic Language Selection
 * Avtomatik Dil Seçimi üçün Region Aşkarlama
 */

export type Locale = 'az' | 'en' | 'zh' | 'ru' | 'tr';

/**
 * Map country codes to locales
 * Ölkə kodlarını dillərə map et
 */
const countryToLocaleMap: Record<string, Locale> = {
  // Azərbaycan region
  'AZ': 'az', // Azərbaycan
  'AM': 'az', // Ermənistan (azərbaycan dili də istifadə olunur)
  'GE': 'az', // Gürcüstan (azərbaycan dili də istifadə olunur)
  
  // İngilis region
  'US': 'en', // Amerika Birləşmiş Ştatları
  'GB': 'en', // Böyük Britaniya
  'AU': 'en', // Avstraliya
  'CA': 'en', // Kanada
  'NZ': 'en', // Yeni Zelandiya
  'IE': 'en', // İrlandiya
  
  // Çin region
  'CN': 'zh', // Çin
  'TW': 'zh', // Tayvan
  'HK': 'zh', // Honq Konq
  'SG': 'zh', // Sinqapur
  
  // Rus region
  'RU': 'ru', // Rusiya
  'BY': 'ru', // Belarus
  'KZ': 'ru', // Qazaxıstan
  'UA': 'ru', // Ukrayna (rus dili də istifadə olunur)
  'KG': 'ru', // Qırğızıstan
  
  // Türk region
  'TR': 'tr', // Türkiyə
  'CY': 'tr', // Kipr
};

/**
 * Detect locale from Accept-Language header
 * Accept-Language header-dən dil aşkarla
 */
export function detectLocaleFromLanguage(language: string | null): Locale {
  if (!language) return 'az';
  
  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,az;q=0.8")
  // Accept-Language header-i parse et (məs: "en-US,en;q=0.9,az;q=0.8")
  const languages = language.split(',').map(lang => {
    const [code] = lang.trim().split(';');
    return code.toLowerCase();
  });
  
  // Check for exact matches first
  // Əvvəlcə dəqiq uyğunluqları yoxla
  for (const lang of languages) {
    if (lang.startsWith('az')) return 'az';
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('ru')) return 'ru';
    if (lang.startsWith('tr')) return 'tr';
  }
  
  return 'az'; // Default
}

/**
 * Get locale from country code
 * Ölkə kodundan dil al
 */
export function getLocaleFromCountry(countryCode: string | null): Locale {
  if (!countryCode) return 'az';
  
  const upperCode = countryCode.toUpperCase();
  return countryToLocaleMap[upperCode] || 'az';
}

/**
 * Detect locale from IP (simplified - in production use Vercel Edge Config or Cloudflare)
 * IP-dən dil aşkarla (sadələşdirilmiş - production-da Vercel Edge Config və ya Cloudflare istifadə et)
 */
export async function detectLocaleFromIP(ip: string | null): Promise<Locale> {
  if (!ip) return 'az';
  
  // In production, use Vercel Edge Config or Cloudflare GeoIP
  // Production-da Vercel Edge Config və ya Cloudflare GeoIP istifadə et
  // For now, return default
  // İndilik default qaytar
  
  // Example with Vercel Edge Config:
  // const country = await getCountryFromIP(ip);
  // return getLocaleFromCountry(country);
  
  return 'az';
}

/**
 * Get default locale based on request headers
 * Request header-lərinə əsasən default dil al
 */
export async function getDefaultLocale(
  acceptLanguage: string | null,
  countryCode: string | null
): Promise<Locale> {
  // Priority: 1. Country code, 2. Accept-Language header, 3. Default (az)
  // Prioritet: 1. Ölkə kodu, 2. Accept-Language header, 3. Default (az)
  
  if (countryCode) {
    const locale = getLocaleFromCountry(countryCode);
    if (locale !== 'az') return locale; // If country code gives us a specific locale
  }
  
  if (acceptLanguage) {
    return detectLocaleFromLanguage(acceptLanguage);
  }
  
  return 'az'; // Default
}


