# ThreeUI Community — Interface Lines

Upstream: https://github.com/MengTo/threeui
Source commit: `68802d5428071ada5c20db8094b1649e6bb770ed`
Retrieved: 2026-10-08
Official preview: https://threeui.com/backgrounds/constellation-field/interface-lines
Source: `src/shaders/neuform-isolated/sources/interface-lines.html`
Catalogue: `src/data/shaders.tsx`

`interface-lines.original.html` preserves the original reference, and is not served or executed by this application. `LICENSE` retains the full MIT license and Copyright (c) 2026 Meng To. The derived implementation in `app/components/artist-network-background.tsx` carries an attribution pointing here.

The latest npm release checked was `@designcodeio/threeui@1.2.0`. Its actual `lib-dist/index.d.ts` exports `ConstellationField`; the official wrapper dispatches `variant="interface-lines"` to `InterfaceLines`. React peer range `>=18 <20` includes this project's React 18.3.1. Package-wide Three.js peers and aliased Three dependencies are unnecessary for this specific Canvas 2D effect, so no package dependency was added.

Adaptation retains the original drifting particles, pairwise distance threshold of 120px, and proximity alpha formula `0.28 + (1 - distance / 120) * 0.42`. Changes: section sizing, neutral brand color, density/opacity/speed multipliers, 0.75px strokes, omission of square nodes and all source UI, text exclusion areas, time-based movement, visibility suspension, reduced motion, keyboard pause control, mobile frame cap, and complete cleanup. No other Constellation Field variant was incorporated.
