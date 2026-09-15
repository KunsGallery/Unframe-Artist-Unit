import { cookies } from "next/headers";
import { getLocale, type Locale } from "./i18n-shared";

export function getServerLocale(): Locale {
  return getLocale(cookies().get("uau-locale")?.value);
}
