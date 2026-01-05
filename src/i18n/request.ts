import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || 'en';

  const translation = await import(`../../locales/${locale}/index.ts`);

  return {
    locale,
    messages: translation.default
  };
});