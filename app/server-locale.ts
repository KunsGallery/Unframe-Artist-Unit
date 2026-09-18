import { cookies, headers } from "next/headers";
import { getLocale, type Locale } from "./i18n-shared";

export function getServerLocale(): Locale {
  const cookieLocale = cookies().get("uau-locale")?.value;
  if (cookieLocale) return getLocale(cookieLocale);
  const browserLanguage = headers().get("accept-language")?.split(",")[0]?.toLowerCase();
  return browserLanguage?.startsWith("ko") ? "ko" : "en";
}
