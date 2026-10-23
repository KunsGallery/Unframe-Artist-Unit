"use client";

// Last resort when the root layout itself fails; it renders without site chrome or providers.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="ko"><body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#F4F0E8", color: "#171817", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
    <main style={{ maxWidth: 520, padding: 24 }}>
      <p style={{ color: "#1438EE", fontSize: 12, letterSpacing: 2 }}>u.a.u / UNFRAME ARTIST UNIT</p>
      <h1 style={{ fontFamily: "Baskerville, 'Times New Roman', serif", fontWeight: 400, fontSize: 40, margin: "16px 0" }}>페이지를 열지 못했습니다.</h1>
      <p style={{ color: "#6D6A62" }}>잠시 후 다시 시도해 주세요. This page could not open — please try again.</p>
      <button type="button" onClick={reset} style={{ marginTop: 16, padding: "12px 20px", border: 0, background: "#1438EE", color: "#fff", cursor: "pointer" }}>다시 시도 / Try again</button>
    </main>
  </body></html>;
}
