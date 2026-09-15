# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Next.js + React + TypeScript, with a runnable MVP that keeps backend integrations replaceable.

## Users

Primary users are artists who want to build a public practice profile, share works, and stay connected after exhibitions. Secondary users are curators, galleries, cultural professionals, collectors, and clients looking for artists, works, and collaboration opportunities.

## Product Purpose

u.a.u (UNFRAME ARTIST UNIT) is a relationship-first global artist network. It connects and records relationships that begin in exhibitions, then extends them into ongoing activity, projects, and new connections. Early success means a good artist can join, build a profile, publish works, and be found by the right people — while the network makes continuity visible.

## Positioning

u.a.u is a global artist network built around connection and continuity. It turns artistic relationships into ongoing practice, projects, discovery, opportunity, and archive; it is not only a portfolio directory, social feed, marketplace, or SaaS tool.

## Operating Context

The public experience is editorial and image-led. The product supports a Korean and English audience from the start, separates nationality from based-in location, and treats exhibitions as the beginning of longer relationships. The first implementation is a front-end MVP using authored demonstration content until production services are connected.

## Capabilities and Constraints

- MVP surfaces: home, artist discovery, work discovery, artist detail, project/archive, connections, save/shortlist, login, dashboard, and admin overview.
- Artist membership is curated: anyone can create an account, but u.a.u Artist status is approved by UNFRAME.
- The core loop is Artist → Encounter → Connection → Activity → Record → New Connection. Search, shortlist, proposal, and opportunity tools support that loop; membership and payment stay secondary infrastructure.
- Approved u.a.u Artists receive a non-paid verified mark that indicates UNFRAME review and official connection to the network. The mark is not proof of exclusivity or a sales badge.
- Annual Connection Recap is a public record of the year's people, projects, connections, cities, and process-focused awards. `CONNECTED 2027` is the first authored demonstration surface.
- Core data entities include users, artists, artworks, projects, connections, opportunities, shortlists, proposals, memberships, journal, galleries, and collectors.
- Planned production integrations are Firebase Auth + Firestore, Algolia, Cloudflare R2, PortOne, Resend, PostHog, and Netlify.
- The current build is a runnable UI prototype; production authentication, persistence, search indexing, payments, and media storage remain open implementation work.

## Brand Commitments

- Name: u.a.u / UNFRAME ARTIST UNIT.
- Core line: “전시에서 시작된 관계가 그 이후에도 이어집니다.” / “A gallery that stays connected.”
- The supplied u.a.u logo is the primary brand asset. The transparent full lockup and symbol-only mark live in `public/assets/` and are used throughout the interface.
- Visual direction: off-white or ivory, near black, UNFRAME blue, wide whitespace, thin rules, editorial typography, and strong single-image moments.
- Voice favors relationship, direction, attitude, loose solidarity, coexistence, process, rhythm, connection, and what comes after; it avoids startup/SaaS hype.

## Evidence on Hand

The master plan at `/Users/jaewookim/Desktop/uau_final_master_plan.md` is the source of product, brand, information architecture, data, security, and roadmap requirements. No artist image library or verified public artist dataset was provided, so the MVP uses clearly authored synthetic demonstration content and must not imply live records.

## Product Principles

1. Relationship before feature.
2. Artists enter through practice, remain through relationship, and move through connection.
3. Curated membership protects trust while public discovery stays generous.
4. Exhibition afterlife is first-class archive material.
5. Global by structure: language, nationality, based-in location, and currency are separate concerns.

## Accessibility & Inclusion

Use semantic HTML, keyboard-visible focus, descriptive labels, adequate contrast, reduced-motion support, and responsive layouts. Keep Korean and English content available without making either language a second-class path.
