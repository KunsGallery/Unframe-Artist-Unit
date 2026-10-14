# Whole archive search and exhibition links — 2026-10-14

## Changes

Artists and works search traverse all published profiles in batches of 100 when a search/filter is active. Browsing still uses the existing 24-profile pagination. Partial results are not presented as a complete result set; failed traversals offer retry, cancelled traversals cannot replace current results. Demo and non-artist profiles are excluded. This is a correctness-first implementation using existing Firestore permissions, not an indexed search engine: reading costs and latency scale with all published profiles. A dedicated maintained search index remains necessary for large-scale operation. No private users or drafts are searched.

Exhibition records accept optional `workRefs: [{artistSlug, workId}]`. The existing professional/admin editor lets organizers choose works from participants. Deselecting a participant removes their work references; save rejects references to non-participants. Legacy records normalize to an empty list. The exhibition page resolves public participants by document ID rather than the first directory page and links explicit exhibited works to work details. Artist pages always display linked public exhibition records, even when their manually authored CV is empty. Work pages show only explicit exhibition references, not all exhibitions of the artist. Existing exhibition → gallery and gallery → exhibition links remain.

## Validation

- Production Next.js build passed including type checking.
- 11 tests passed (four new archive regressions plus existing data/banner checks).
- New tests cover results beyond profiles 24 and 100, an exactly full final page, cancelled and failed traversals, malformed/duplicate/legacy work references.
- TypeScript no-emit check and whitespace check passed.
- No Firestore permission rule changes or database migration required. Existing exhibitions must be edited to select actual works; no historical links were guessed or production data modified.
- Browser check performed with the production build locally; screenshots and runtime limitations recorded separately below.
- Earlier uncommitted gallery prototype, handoff package and historical screenshots are excluded from this feature commit.
