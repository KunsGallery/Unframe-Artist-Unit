# Artist page templates — design QA

Date: 2026-10-03
Scope: existing artist pages and the shared artist/admin profile editor. No production data was created, changed or published.

## Visual truth

Approved source images (retained as picker assets):
- public/assets/artist-templates/gallery.jpg — White Cube
- public/assets/artist-templates/editorial.jpg — Journal
- public/assets/artist-templates/archive.jpg — Archive

Generated source originals: /Users/jaewookim/.codex/generated_images/01a0a34a-5d8e-7d71-93ac-d4934ef0197c/exec-72645692-494d-4cf9-b4e4-e0f81f70934d.png, exec-618d21c3-9c6b-4414-b6d1-e54e94f35e41.png, exec-67d860ad-15b1-4aa6-8633-5252a70272c7.png.

## Evidence and normalization

Browser: Codex in-app browser, localhost:3001. Logged-in shared editor checked using unsaved changes; original account role restored by reloading. Visual fixture rendered the actual ArtistProfileView and ArtistTemplatePicker components without Firestore writes, then was removed.

Desktop capture: 1440 × 1000 CSS viewport, 1425-pixel document width excluding scrollbar, density 1. Mobile: 390 × 844 CSS viewport, 375-pixel document width excluding scrollbar, density 1. Initial desktop captures used the browser's 1280 × 960 default before the override took effect; final evidence replaces these captures.

Source images are portrait full-page concepts, not desktop viewport screenshots. Sources and browser page regions were normalized to 640 pixels wide and composed in the same comparison image:
- Source pixels: Gallery 971 × 1619, Journal 819 × 1920, Archive 971 × 1619. Final full browser pixels: Gallery 1425 × 4165, Journal 1425 × 4227, Archive 1425 × 3444 (including fixture picker; comparison crops exclude it).
- docs/audits/artist-templates/gallery-comparison.jpg
- docs/audits/artist-templates/editorial-comparison.jpg
- docs/audits/artist-templates/archive-comparison.jpg

Focused first-viewport comparisons: the corresponding *-hero-comparison.jpg files. Full browser captures: *-desktop.jpg, *-mobile.jpg. Readable mobile region: *-mobile-detail.jpg. Shared editor screenshots: picker-desktop.jpg and picker-mobile.jpg. Crop measurements: regions.json.

Content-state differences: the temporary fixture used the approved Pring portrait repeatedly to test six work slots; these are geometry tests, not six invented Pring artworks. The public renderer always uses the actual artist's images. No fabricated exhibitions, works or accounts were persisted. The source's virtual-gallery, studio and inspiration blocks are conditional: missing content/integration does not produce a fake public link. The mock's generated text is not copied into artist content.

## Comparison history

Round 1 findings:
- P2 Archive work heading was oversized and delayed access to its index. Reduced heading and spacing; final capture shows compact profile and three-column work grid.
- P2 Journal opening resembled a profile rather than a story. Added a short opening line from the existing statement, stronger asymmetric columns, and subordinate artist identity.
- P2 Journal statement lacked the image/text contrast shown in the source. Added the artist's own available cover/work image beside the dark statement section.
- P2 Gallery and Journal were too long with six equally prominent selected works. Show two selected works and a functioning full-archive dialog; Archive retains six.
- P2 Incumbent work treatment cropped/tinted imagery. Use contain and normal blend mode; source artwork ratios/colors remain intact.
- P2 Archive biography and CV were sequential instead of a compact paired record. Pair adjacent About/CV sections without overriding manual section order.

Round 2: recaptured all three templates at desktop/mobile and regenerated combined source/render comparisons. These issues are resolved in the final evidence. No horizontal overflow at 390px (375px content width). Source variations for actual uploaded image ratios, multilingual content, existing logo, conditional sections, badges and draft banner are accepted product adaptations, not pixel-exact reproduction claims.

## Required fidelity surfaces

- Typography: existing U.A.U serif/sans system retained; display hierarchy differs meaningfully per template. Long names wrap; multiline introductions/statements retain line breaks.
- Spacing/layout: full-width artwork opening versus split journal versus compact archive; two-column/three-column work composition and responsive single-column reflow. Sections retain the artist's configured ordering.
- Colors/tokens: established ivory, ink and blue retained; Journal uses #121212 with readable light statement text. Existing artist accent choices retained.
- Image quality: compressed real approved mockups used in picker, no CSS illustration substitutes. Public works retain their actual images, original ratio, and normal color blend.
- Copy/content: bilingual controls, explicit example labeling, selected state, common/optional guidance and no false virtual-exhibition promises.

## Interactions tested

- Three template choices and selected state update.
- Full example dialog opens; Escape closes it.
- Unsaved artist editor remains unsaved; no save/publish action taken.
- Archive year filter changes six works to three, then resets.
- Work details open; next-work control updates the title.
- Full archive dialog exposes all six works after two-work summary.
- Empty public sections are omitted (data regression tests).
- Browser console: no error entries on final fixture captures. Earlier Next development warning came from the intentionally invalid private-folder test URL; that temporary route was corrected and removed.

## Finish review

No subagent facility was available; a bounded in-thread evidence review substituted for the independent finish reviewer.

disposition: ship
- persistence: existing project identity preserved; approved assets and capture evidence retained.
- fidelity: artwork hero, asymmetric journal, dark contrast section, compact archive and real selection imagery match the agreed structural intent. TYPE: established bilingual typefaces retained. MATERIAL: approved raster images and real artist imagery, not CSS drawings.
- ceiling: reached for the agreed template/layout scope; operational 3D gallery integration is not part of this change.
- material_fixes: none remaining within scope.
- keep: preserve real artist content, optional-section hiding and meaningful template differences.

## Follow-up / limitations

Final validation: npm run build passed, including type checking. node --test tests/ux-data.test.cjs passed 2/2. Changed-target design detector returned no findings. git diff --check passed. Final production-mode local server runs on localhost:3001; no git push or deployment was performed.

Persisting actual profile edits was not tested against production Firestore because visual QA must not publish sample records. Virtual exhibition server integration remains separate. Very long CVs and external inquiry delivery are not newly changed or tested here.

final result: passed
