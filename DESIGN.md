# u.a.u Design System

## Direction

The interface treats u.a.u as an editorial relationship archive rather than a generic portfolio marketplace. The visual language is built from paper, ink, and a single decisive blue. The first viewport puts the proposition beside one artwork and a visible connection trace, so the mechanism is understood before the visitor starts browsing.

## Color

- Paper: `#F4F0E8`
- Paper deep: `#E8E0D3`
- Ink: `#171817`
- Muted ink: `#6D6A62`
- UNFRAME blue: `#1438EE`
- Blue wash: `#D9E0FF`
- Secondary clay: `#B86F59`
- Secondary olive: `#A2A88A`

## Typography

- Display and editorial voice: Baskerville / Iowan Old Style / Times New Roman fallback stack.
- Interface and utility voice: Helvetica Neue / Helvetica / Arial fallback stack.
- Display headings use tight tracking and compact line height; utility labels use uppercase tracking and stay small.

## Layout

- Public surfaces use a centered maximum width of 1280px with generous vertical pacing.
- Hairline rules divide editorial sections; borders carry more structure than shadows.
- Cards are used only where an artwork or work unit benefits from a contained image. Lists and split compositions carry the broader site structure.
- At narrow widths, two-column editorial sections collapse to one column, navigation becomes a compact menu, and metadata is selectively hidden to keep the artwork and relationship readable.

## Components

- `Nav`: sticky paper header with text navigation and a blue Join action.
- `DemoNotice`: explicit label for synthetic demonstration content.
- `Logo`: supplied transparent full lockup for primary navigation and symbol-only mark for compact navigation and verification.
- `ArtImage`: shared image treatment with authored artwork asset and controlled color blend modes.
- `SectionHeading`: editorial title plus quiet text action.
- `BookmarkButton`: local saved state with pressed state and accessible label.
- `VerifiedMark`: compact u.a.u lockup for approved artists; it communicates network membership, never payment or exclusivity.
- Artist rows, project rows, relationship nodes, dashboard cards, and review rows share hairline separators and blue interaction states.
- `RecapBanner` / recap surfaces: annual records use large editorial numerals, a relationship/orbit motif, and process-focused award rows rather than leaderboard styling.

## Interaction

- Navigation uses a compact mobile disclosure.
- Search and select controls filter the demonstration archive in place.
- Shuffle selects a work title for an unexpected entry point.
- Save toggles a visible saved state; production persistence is intentionally deferred.
- Links make the primary journey discoverable: artists → works → connections → projects.
- The home hierarchy now leads with people, connections, projects, and afterlife; recap is a public record and membership stays behind the network experience.
- Motion stays restrained: image scale on hover, arrow translation, and button lift. Reduced-motion users receive near-static transitions.

## Content rules

Use the product's own vocabulary: relationship, direction, practice, rhythm, connection, after, and archive. Keep synthetic content labelled. Do not add live-sounding claims, testimonials, counts, or commercial guarantees without source data.
