'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { setLocaleCookieClient } from '@/lib/cookies';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

const languages = [
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (newLocale: string) => {
    // Save to cookie / Cookie-də saxla
    setLocaleCookieClient(newLocale as any);
    
    // Navigate to new locale / Yeni dilə keç
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="w-full">
      <Select value={locale} onValueChange={changeLanguage}>
        <SelectTrigger className="w-full border border-gray-300 shadow-sm">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{languages.find(l => l.code === locale)?.flag}</span>
              <span className="text-sm font-medium">
                {languages.find(l => l.code === locale)?.name}
              </span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


