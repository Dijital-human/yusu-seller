import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // Supported locales / Dəstəklənən dillər
  locales: ['az', 'en', 'zh', 'ru', 'tr'],
  
  // Default locale / Varsayılan dil
  defaultLocale: 'az',
  
  // Always show locale prefix in URL / URL-də həmişə dil prefiksi göstər
  localePrefix: 'always'
});

// Export navigation utilities / Naviqasiya alətlərini export et
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);


