"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Locale } from "./i18n-shared";

type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function I18nProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("uau-locale", locale);
    document.cookie = `uau-locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside I18nProvider");
  return context;
}
