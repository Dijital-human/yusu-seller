import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  // Bu adətən `[locale]` seqmentinə uyğun gəlir
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  // Etibarlı bir dilin istifadə olunduğundan əmin ol
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});


