import { defineRouting } from 'next-intl/routing';
 
export const routing = defineRouting({
  locales: ['en', 'da'],
  localePrefix: 'as-needed',
  defaultLocale: 'en'
});