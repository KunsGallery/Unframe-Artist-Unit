import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "./site-chrome";
import { I18nProvider } from "./i18n-provider";
import { getServerLocale } from "./server-locale";
import { AuthProvider } from "./auth-provider";
import { PageTransition } from "./page-transition";
import { SiteSettingsProvider } from "./site-settings";
import { SiteContentProvider } from "./site-content";
import { SitePageContentProvider } from "./site-page-content";
import { GuideLauncher } from "./components/guide-launcher";
import { PreviewInlineEditor } from "./components/preview-inline-editor";
import { siteUrl } from "./site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "u.a.u — UNFRAME ARTIST UNIT",
  description: "A gallery that stays connected. Discover artists, works, projects, and the relationships between them.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = getServerLocale();
  return <html lang={locale}><body>
    <AuthProvider><I18nProvider initialLocale={locale}><SiteSettingsProvider><SiteContentProvider><SitePageContentProvider><PreviewInlineEditor /><SiteChrome part="header" /><PageTransition>{children}</PageTransition><SiteChrome part="footer" /></SitePageContentProvider></SiteContentProvider></SiteSettingsProvider></I18nProvider></AuthProvider>
  </body></html>;
}
