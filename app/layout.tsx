import type { Metadata } from "next";
import "./globals.css";
import { Nav, Footer } from "./components";
import { I18nProvider } from "./i18n-provider";
import { getServerLocale } from "./server-locale";
import { AuthProvider } from "./auth-provider";
import { PageTransition } from "./page-transition";
import { SiteSettingsProvider } from "./site-settings";
import { SiteContentProvider } from "./site-content";

export const metadata: Metadata = {
  title: "u.a.u — UNFRAME ARTIST UNIT",
  description: "A gallery that stays connected. Discover artists, works, projects, and the relationships between them.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = getServerLocale();
  return <html lang={locale}><body>
    {/* THESIS: Make the relationship itself the first interface, refusing the generic portfolio grid. OWN-WORLD: ivory paper, near-black ink, cobalt blue, thin rules, editorial type, and image-led compositions. STORY: the visitor sees a practice, follows its connections, and enters an ongoing project. FIRST VIEWPORT: proposition on the left, a single artwork and connection path on the right, with one clear trace action. FORM: editorial relationship archive, assigned direction 7, degraded seed b8b0ce36. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
    <AuthProvider><I18nProvider initialLocale={locale}><SiteSettingsProvider><SiteContentProvider><Nav /><PageTransition>{children}</PageTransition><Footer /></SiteContentProvider></SiteSettingsProvider></I18nProvider></AuthProvider>
  </body></html>;
}
