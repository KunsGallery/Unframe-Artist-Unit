# U.A.U. Interface Lines — 2026-10-08

## Placement and files

Existing artwork-led hero, authored copy, navigation, links, fonts, site colors and editable section order are preserved. Only the existing `intro` section (`#about`) receives the effect. There is no overlay on artwork, fixed page background or second network effect.

- `app/page.tsx`: integration in the existing brand introduction.
- `app/components/artist-network-background.tsx`: independent client Canvas 2D renderer and localized control.
- `app/home.css`: isolated background layer, clipping, quiet control and keyboard focus.
- `third-party/threeui/`: upstream source, provenance and full MIT notice.
- This directory: desktop/mobile screenshots and verification record.

## Final settings

| Setting | Desktop | Mobile (≤640px) |
|---|---|---|
| Background | `var(--paper)` / #f4f0e8 | same |
| Lines | `var(--muted)` / #6d6a62 | same |
| Speed multiplier | 0.4 | 0.25 |
| Density multiplier | 0.5 (35 particles) | 0.3 (9 particles) |
| Opacity multiplier | 0.25 | 0.18 |
| Effective line alpha | 0.07–0.175 | 0.0504–0.126 |
| Size / connection length | 1 / 1 (120px threshold) | same |
| Line width | 0.75 CSS px | same |
| Render cap | 30fps | 24fps |
| Pixel ratio | maximum 2 | maximum 2 |

The original catalogue's speed range is 0–3; implementation clamps speed to that range. The upstream wrapper accepts density ≥0.25; both chosen density values are supported. Opacity scales the original distance-dependent alpha, not an opaque full-strength line. Text boxes plus 18px clearance are excluded from Canvas drawing. No dot renderer is used. Settings exist only as component props, not administrator controls.

## Verification

- Production build passed (compilation, TypeScript, built-in lint and generation of 32 static pages).
- Existing UX-data and moving-banner tests: 7 passed.
- Design detector: no findings. `git diff --check`: passed.
- Chromium-based in-app browser: inspected 1440×1000 desktop, 375×812 mobile and 812×375 landscape. No horizontal overflow; Canvas follows section size.
- Actual Canvas pixels change during animation and remain unchanged after pause and under `prefers-reduced-motion: reduce`.
- Final production preview: followed the About link and returned through browser history; a single Canvas is mounted and its pixels change again. Final `desktop.png` and `mobile.png` are captured from the production build.
- Pause/resume works with keyboard Enter and correctly changes `aria-pressed` and localized action text.
- Offscreen Canvas pixels remain unchanged. IntersectionObserver controls scheduling; resumption resets the clock to avoid elapsed-time jumps.
- Background has `aria-hidden=true`, no focusable element, and pointer-events:none. Copy remains HTML and the About link remains operable.
- Inspected browser console showed no warning/error entries during the initial behavior pass. A subsequent simultaneous build/dev-cache mismatch produced missing development assets; the dev server was stopped, the build rerun successfully, and the final preview uses the built production server with independent fresh navigation.
- Cleanup cancels animation frames, disconnects both observers and removes resize, visibility and media-query listeners.
- No frame-by-frame React state updates or new runtime dependencies. Mobile sustained slow frames trigger static fallback.

## Limits

- Safari and physical mobile devices were not available for this verification. Actual touch scrolling and low-powered-device fallback need device testing.
- The in-app browser did not report document.hidden when another tab opened; real hidden-tab suspension is implemented via visibilitychange but that browser transition could not be exercised here.
- No global motion preference exists in the current project. The background has its own control; the existing moving-text strip retains its independent control. Pause state lasts for the mounted section and is not stored across visits.
- Firestore emulator/security-rule tests were not run; no data, authentication or rule changes are included.
- No production deployment performed. Live local preview: http://localhost:3000/#about while the preview server is running.
