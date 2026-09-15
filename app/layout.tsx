import type { Metadata } from "next";
import "./globals.css";
import { Nav, Footer } from "./components";

export const metadata: Metadata = {
  title: "u.a.u — UNFRAME ARTIST UNIT",
  description: "A gallery that stays connected. Discover artists, works, projects, and the relationships between them.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    {/* THESIS: Make the relationship itself the first interface, refusing the generic portfolio grid. OWN-WORLD: ivory paper, near-black ink, cobalt blue, thin rules, editorial type, and image-led compositions. STORY: the visitor sees a practice, follows its connections, and enters an ongoing project. FIRST VIEWPORT: proposition on the left, a single artwork and connection path on the right, with one clear trace action. FORM: editorial relationship archive, assigned direction 7, degraded seed b8b0ce36. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
    <Nav />{children}<Footer />
  </body></html>;
}
