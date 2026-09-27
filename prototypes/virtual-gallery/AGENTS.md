# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable gallery decisions (2026-09-26)

- This is an isolated local proof of concept. Do not connect production data, deploy, or alter the existing U.A.U site without a new user request.
- Approved U.A.U artists should eventually have a fixed, simple two-room exhibition model holding roughly 6–9 works.
- Offer three selectable ceiling presets: luminous ceiling (광천장), plain ceiling (일반 천장), and glass ceiling (유리천장).
- Fix the lighting color preset at 6000 K. Default to overall room lighting; optionally switch to artwork-focused spots.
- Reuse preset light rigs and fixed artwork positions. Never bake separate light maps per artist or work.
- Use medium-size images on the walls, and fetch the original only when the visitor opens a work.
- The current artist, title, and six abstract artworks are fictional sample content; clearly distinguish them from live U.A.U data.
- The user wants the 3D room to feel much closer to the selected gallery mock, not like untextured white geometry. Use restrained, realistic wall plaster, pale polished microcement, and luminous ceiling diffuser textures; keep the existing controls and 6000 K lighting behavior.
- On a visitor's first visit per device and exhibition, show a poster-led exhibition details card (title, artist, venue, dates, description, work count), then the controls guide only if that device has not seen it. Keep both dialogs manually reopenable.
- The local prototype editor should make placing content straightforward: up to 9 image/video works on labeled wall slots and up to 4 GLB objects on labeled pedestals across the two rooms. Prevent slot collisions.
- Store local drafts in localStorage and uploaded binary assets in IndexedDB. Generate a max-1400px WebP preview for uploaded artwork; keep the original local and load it only when a visitor opens the artwork. Keep the prototype explicitly local-only; this persistence does not synchronize to another device or the production site.
- Uploaded 3D models are single-file GLB assets, limited to 25 MB and auto-scaled onto a floor pedestal; videos use validated YouTube links and open in a privacy-enhanced YouTube embed only when clicked. Explain these limitations in the editor.
- Exhibition data and poster are editable in the prototype, and the exhibition intro remains manually accessible from the header after first dismissal.
- W/A/S/D is movement (A/D strafe relative to the current look direction without rotating the camera); arrow keys and the on-screen left/right controls rotate in place.
- Spread wall works along the full length of each room rather than clustering pairs near the connecting doorway. Keep the doorway's reveal/frame shallow (about 24 cm), preserving a clear opening.
- Keep wall artwork positions centered on their wall or wall segment. Reserve one position to either side of the inter-room doorway and keep the center opening clear.
- Place the exhibition introduction and U.A.U wordmark together on the left wall near the first-room entry; keep the center sightline and route open.
- Let artists tune each image's hanging position along its selected wall and vertically, plus scale it within safe wall bounds; preview changes live before saving. Offer a default frame, no frame, or a canvas with 2.5/5 cm depth and image-wrap/white/black edges.
- Artwork-focused 6000 K spots are configured per work in the Space Styling tab: choose a softly feathered circular or square beam and adjust its beam angle from 18° to 50°. Keep a gentle ambient gallery wash in focused mode so unlit walls remain legible; use shared procedural light masks rather than per-work baked maps.
- Each artwork's focused beam must be exactly one selected shape. Do not layer a circular SpotLight or radial point-light pool on the square mask, and do not cut a rectangular transparent hole around the artwork; project the filled mask onto the wall behind the work so its image stays clear.
- Each wall artwork's rail-light head must sit on a room rail, aim at that artwork's current hanging position, and use a closed circular or square aperture matching its selected beam. Keep the lens rigidly attached to the housing so a ceiling rail cannot appear through an empty lamp opening. Update the head live when the work is moved or its beam shape changes.
- Artwork detail views should expose a direct link that opens the matching work detail immediately. Links to artist websites and social profiles should navigate to their destination rather than copying addresses. In this browser-only prototype the URL and content remain local; production sharing requires a public URL and shared exhibition data/assets.
- On mobile, offer a touch-friendly artwork list so visitors can open any work without navigating the 3D rooms. Artists can upload a recorded audio guide per work; optional U.A.U recording/production support may be offered as a separate paid service.
