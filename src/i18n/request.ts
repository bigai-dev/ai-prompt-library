import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from "./routing";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    cookieLocale && (locales as readonly string[]).includes(cookieLocale)
      ? (cookieLocale as Locale)
      : defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
