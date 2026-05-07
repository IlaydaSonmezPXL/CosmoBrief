# Handoff: Cosmo Brief — Editorial Redesign

## Overview

A complete editorial-magazine redesign of **Cosmo Brief**, a daily personal-edition space-news web app. Same data and feature set as the existing app (article feed, astronomical events, reading map, daily Wordle) — completely new visual direction inspired by long-form newspaper / magazine front-pages.

The design treats the home page as a single scrolling "edition" of the day rather than a dashboard. Sections include:

1. **The Edition** — masthead, brand bar, sticky section nav, full-bleed lead story
2. **Tonight's Sky** — 4 astronomical events as poster-style cards (one featured)
3. **Long Reads** — two image-led editorial features
4. **Pull quote** — typographic breaker between sections
5. **The Wire** — compact 2-column thumbnail list of every other article
6. **Reading Orbit** — donut chart of topic counts + breakdown table
7. **The Daily Cipher** — Wordle reframed as a quiet card with stats
8. **Footer** — flips back to ivory paper, magazine-style colophon

---

## About the Design Files

The HTML files in this bundle are **design references** — prototypes built to show intended look, hierarchy, and behavior. They are **not** production code to ship as-is.

The task is to **recreate this design inside the existing Cosmo Brief codebase** (its existing framework, component library, routing, and data layer). If no UI environment exists yet for this surface, pick the framework that best matches the rest of the codebase (most likely React) and implement there.

The reference HTML uses inline React + Babel for prototyping speed. In production, decompose each section into proper components, wire them to the real data sources (SNAPI for articles, AstronomyAPI for events, the existing Wordle engine), and use the project's existing CSS-in-JS / module system.

---

## Fidelity

**High-fidelity.** Colors, typography, spacing, and layout are intended to be matched pixel-faithfully. The exact hex values, font stacks, and font-size/line-height/letter-spacing values are listed in the **Design Tokens** section below.

Imagery uses placeholder Unsplash URLs in the prototype — production should use the real article hero images that the existing app already fetches.

---

## Screens / Views

This is a **single-page** design. The user scrolls top-to-bottom. The sticky nav at the top scroll-jumps between sections.

### 1. Masthead

- Background: `#f4ede0` (paper), text `#0a0a0f` (ink)
- Padding: `0.55rem 2.5rem`, bottom border `1px solid #0a0a0f`
- Layout: flex, `justify-content: space-between`, vertically centered
- Type: `JetBrains Mono`, `0.72rem`, `letter-spacing: 0.06em`, `text-transform: uppercase`
- Left: `Tuesday Edition · No. 0117` + greyed live date (`#6b6358`)
- Right: weather pill (5px coral dot + location/conditions/temp), then `Subscribe` link
- The edition number and weather are hardcoded today — wire to real data

### 2. Brand Bar

- Background: `#f4ede0`, padding `1.6rem 2.5rem 1.4rem`, bottom border `1px solid #0a0a0f`
- Layout: `display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 2rem`
- **Left column** — small mono stats stacked (archived signals count, fresh-in-48h count). Color: ink for the strong number, `#6b6358` for the descriptor.
- **Center** — wordmark **Cosmo&Brief**
  - Font: `Fraunces`, italic, weight 900, `font-size: 5.2rem`, `line-height: 0.9`, `letter-spacing: -0.04em`, `font-variation-settings: "opsz" 144`
  - The `&` is wrapped in `.amp` and colored `#e8542c` (signature coral)
- **Right column** — pill chips (`Search`, `Saved`) + circular ink avatar
  - Chips: `0.4rem 0.7rem` padding, `1px solid #0a0a0f`, `border-radius: 999px`. On hover, invert to ink-bg/paper-text (`0.12s` transition).
  - Avatar: `30 × 30 px`, ink background, paper text, `Fraunces` italic 700 0.95rem

### 3. Sticky Section Nav

- Background `#0a0a0f` (ink), text `#d8ccb4` (paper-dim)
- `position: sticky; top: 0; z-index: 50`, padding `0.7rem 2.5rem`, bottom border `1px solid #2a2730`
- Type: `JetBrains Mono`, `0.72rem`, `letter-spacing: 0.1em`, `text-transform: uppercase`
- Items separated by `gap: 1.7rem`
- Active link: text `#f4ede0` and `border-bottom: 1px solid #e8542c` (`padding: 0.2rem 0`)
- Spacer pushes the live indicator (pulsing 7px coral dot + `Updated 14 minutes ago`) to the right edge
- Active state is auto-tracked via IntersectionObserver with `rootMargin: "-72px 0px -55% 0px"`

### 4. Hero (`#top`)

- `height: 78vh; min-height: 620px`, full-bleed image with overlay gradient
- Overlay: `linear-gradient(180deg, rgba(10,10,15,0.5) 0%, rgba(10,10,15,0.15) 35%, rgba(10,10,15,0.55) 75%, rgba(10,10,15,0.95) 100%)`
- Content sits in the bottom-left, padding `0 2.5rem 3.2rem`
- **Kicker**: mono `0.74rem`, letter-spacing `0.18em`, color `#e8542c`. Format: `— Lead · {topic} · {site}` (the `—` is a 28px coral rule)
- **Headline**: Fraunces 600, `clamp(2.6rem, 5.5vw, 5.4rem)`, `line-height: 0.96`, `letter-spacing: -0.025em`, `max-width: 18ch`, `text-wrap: balance`. Italic emphasis words are colored `#d4a64a` (gold), weight 500.
- **Deck**: Fraunces italic 400, `1.3rem`, `line-height: 1.5`, `max-width: 56ch`, color `#d8ccb4`
- **Meta row**: mono `0.74rem`, letter-spacing `0.06em`, uppercase, `gap: 1.3rem`. The "Read the brief →" link has `border-bottom: 1px solid #e8542c`.
- **Hero side card** (right-center, hides below 980px wide):
  - 240px wide, `rgba(10,10,15,0.55)` bg with `backdrop-filter: blur(14px)`, `1px solid rgba(244,237,224,0.14)`
  - Padding `1rem 1.1rem`, `border-radius: 4px`
  - Top label: gold mono with leading 5px gold dot
  - "what" line: Fraunces 500 `1.1rem`
  - "when" line: mono `0.72rem` paper-dim
  - Compass row: top border, mono `0.7rem`, with a 26px circular outlined "↗" arrow

### 5. Section Heading (used on §01–§05)

- `padding: 4.5rem 2.5rem 4.5rem`, bottom border `1px solid #2a2730`
- `.section-head` is a 2-column grid, gap 2rem, `align-items: end`, margin-bottom `2.5rem`
- **Section number**: mono `0.7rem`, letter-spacing `0.18em`, color `#8a8378` (mute), preceded by an 8px coral dot. Format: `§ 01 · The View Tonight`
- **Section title**: Fraunces 500, `clamp(2rem, 3.3vw, 2.9rem)`, `line-height: 1.05`, `letter-spacing: -0.02em`, `max-width: 22ch`. Italic emphasis is gold `#d4a64a` weight 400.
- **Section meta** (right-aligned): mono `0.74rem`, uppercase, `min-width: 180px`, `white-space: nowrap`. The "pri" line is paper, `0.85rem`, `display: block`, `margin-bottom: 0.45rem`. Below it sits a mute uppercase link.

### 6. Tonight's Sky (`#sky`) — Poster Strip

- `display: grid; grid-template-columns: 1.2fr repeat(3, 1fr); gap: 1.4rem`
- Cards: ink-soft bg `#1a1a22`, `1px solid #2a2730`, padding `1.4rem 1.4rem 1.6rem`, `min-height: 280px`, flex-column
- On hover: `transform: translateY(-3px)`, border becomes coral
- Card content order: glyph → type label → name → when → spacer → where row
  - **Glyph**: Fraunces italic 500, `4.2rem`, color coral
  - **Type**: mono `0.66rem`, letter-spacing `0.14em`, color mute
  - **Name**: Fraunces 500, `1.45rem`, letter-spacing `-0.01em`
  - **When**: mono `0.74rem`, paper-dim
  - **Where row**: top border `1px solid #2a2730`, padding-top `0.8rem`, mono `0.72rem`, with paper-color strong cardinal direction + altitude
- Featured card (Eta Aquariids): coral background, ink text, glyph 5rem, name 1.85rem; mute/border colors flip to `rgba(10,10,15,0.65)` and `rgba(10,10,15,0.2)`

### 7. Long Reads (`#long`) — Featured 2-up

- `display: grid; grid-template-columns: 1.3fr 1fr; gap: 2rem`
- Each `.feature` is image + kicker + headline + deck + meta
- Image: `aspect-ratio: 16/10` for the wide one, `4/5` for `.feature.tall`. `object-fit: cover`. On parent hover, `transform: scale(1.04)` over 0.5s.
- Bottom-fade gradient overlay on image: `linear-gradient(180deg, transparent 60%, rgba(10,10,15,0.4) 100%)`
- **Kicker**: mono `0.68rem`, letter-spacing `0.14em`, coral
- **Headline**: Fraunces 500, `clamp(1.5rem, 2.4vw, 2.1rem)`, line-height `1.05`, letter-spacing `-0.015em`, `text-wrap: balance` (tall variant: `clamp(1.6rem, 2.6vw, 2.3rem)`)
- **Deck**: Space Grotesk `0.95rem`, line-height `1.55`, color paper-dim, `max-width: 48ch`
- **Meta**: mono `0.7rem`, items separated by 3px mute dots; final "Read" word is coral

### 8. Pull Quote

- `padding: 5rem 2.5rem`, centered
- Quote mark: Fraunces italic, `6rem`, `line-height: 0.5`, coral, margin-bottom `1.5rem`
- Quote: Fraunces 400, `clamp(1.6rem, 2.6vw, 2.3rem)`, line-height `1.25`, `max-width: 26ch`, `text-wrap: balance`. Italic emphasis is gold.
- Attribution: mono `0.74rem`, letter-spacing `0.12em`, mute

### 9. The Wire (`#wire`)

- `display: grid; grid-template-columns: 1fr 1fr; gap: 0 2.5rem`
- Each item: 3-col grid `100px 1fr auto`, padding `1.4rem 0`, bottom border `1px solid #2a2730`
- On hover: `padding-left: 0.5rem` (sliding-in feel), and headline turns coral
- **Thumb**: 100×70px, `object-fit: cover`. If no image, ink-soft bg with Fraunces italic letter (topic initial), `1.4rem`
- **Body**: kicker (mono `0.64rem`, letter-spacing `0.14em`, with topic colored — `fresh` = coral, `aging` = gold, `archived` = mute) + headline (Fraunces 500 `1.1rem`) + deck (`0.85rem`, paper-dim, `max-width: 50ch`)
- **Time**: mono `0.68rem`, mute, `white-space: nowrap`

### 10. Reading Orbit (`#orbit`)

- `display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center`
- **Left**: 360×360 SVG donut. `cx=180, cy=180, rOuter=150, rInner=90`. Each topic is an arc path, opacity `0.85` with a 4–8s pulsing animation. Center disc is ink-fill (`r = 86`) with the total reads (Fraunces italic 500, 42px, paper) and label `READS · 30D` (mono 9px, letter-spacing 2, mute).
- A radial-gradient glow `rgba(232,84,44,0.18) → transparent` sits behind the donut at radius 170.
- **Right**: list of topics. Each row is a 4-col grid (swatch | name | count | trend pill), `padding: 0.9rem 0`, bottom border. Hover: `padding-left: 0.4rem`.
  - Swatch: 14×14px circle in topic color
  - Name: Fraunces 500 `1.15rem`
  - Count: mono `0.78rem` paper-dim
  - Trend pill: mono `0.72rem`, padding `0.2rem 0.55rem`, border-radius 999px. `up` = coral, `flat` = mute, `down` = gold (border colors at 40% alpha of fg).

### 11. The Daily Cipher (`#wordle`)

- `.wordle-promo` is a 2-col grid, gap 3rem, padding `2.5rem`, bg ink-soft, `1px solid #2a2730`
- **Left copy**: Fraunces 500 `2.2rem` headline (italic emphasis = coral), `0.95–1rem` paper-dim paragraph (`max-width: 38ch`)
- **Stats row**: 4 columns, gap 2rem, mono `0.78rem`, uppercase. Strong number above the label is Fraunces italic 500 `1.6rem`, paper.
- **CTA "Share result →"**: coral pill button, ink text, `padding: 0.8rem 1.4rem`, `border-radius: 999px`, mono `0.78rem`, letter-spacing `0.1em`. Hover: `transform: translateX(3px)`.
- **Right board**: 6 rows of 5 tiles, 46×46px each, gap 6px. Tiles use Fraunces italic 600 `1.4rem`, uppercase. States: `correct` = coral fill / ink text; `present` = gold-tinted fill `rgba(212,166,74,0.18)` with gold text/border; `absent` = ink fill, mute text. Empty rows render as ink with `1.5px solid rule`.

### 12. Footer

- Flips back to paper bg `#f4ede0` / ink text
- 4-column grid (`1.4fr 1fr 1fr 1fr`), gap 2.5rem, padding `3rem 2.5rem 1.5rem`, top border `1px solid #0a0a0f`
- Col 1: small wordmark (`Cosmo&Brief`, Fraunces italic 700 2.6rem) + tagline (Fraunces italic `1.05rem`, `max-width: 28ch`, color `#4a4337`)
- Cols 2–4: section header `<h4>` (mono `0.72rem`, letter-spacing `0.14em`, color `#6b6358`) + link list. Links: Fraunces `1rem`, ink. Hover: italic + coral.
- Bottom bar: spans full width, top border ink, padding-top `1.2rem`, mono `0.7rem`, between copyright and stardate

---

## Interactions & Behavior

- **Smooth scroll**: `html { scroll-behavior: smooth; }`. Sections have `scroll-margin-top: 72px` so the sticky nav doesn't cover the heading.
- **Section nav links**: clicking each link calls `el.scrollIntoView({ behavior: "smooth", block: "start" })` on the target section.
- **Active nav tracking**: an `IntersectionObserver` with `rootMargin: "-72px 0px -55% 0px"` and thresholds `[0, 0.1, 0.4]` watches the 6 section IDs (`top`, `sky`, `long`, `wire`, `orbit`, `wordle`) and sets the most-visible one as the active nav link.
- **Hero side card**: hidden below 980px viewport.
- **Card hovers**: sky cards lift 3px and adopt coral border; wire items slide right 0.5rem and headline turns coral; feature images scale 1.04× over 0.5s.
- **Live "Updated N minutes ago"**: pulsing coral 7px dot, animation `pulse 2.4s ease-in-out infinite` (opacity 1→0.5→1, scale 1→1.3→1).
- **Donut**: each arc has a `<animate>` pulsing opacity 0.85→1→0.85 over 4–8s (offset by index).
- **Live clock**: header re-renders the date every 60s via `setInterval`.

## Responsive Behavior

Single breakpoint at `980px`:

- `.sky-strip` collapses to 2 columns
- `.feature-grid`, `.orbit-wrap`, `.wordle-promo`, `.wire-grid` collapse to 1 column
- Wordmark scales from `5.2rem` → `3.5rem`
- Hero side card is hidden
- Footer collapses from 4 cols to 2

A real implementation should add additional breakpoints (≤640px) and ensure all type scales gracefully.

## State Management

The prototype only tracks one piece of state: `active` (currently visible section ID, used to highlight the nav link). In the real codebase, the rest of the page is data-driven:

- `lead` — top article (most recent + highest-priority topic)
- `featured2`, `featured3` — next two articles flagged as long-reads
- `wire[]` — every remaining unread/aging article
- `astroEvents[]` — next 4 upcoming events from AstronomyAPI, the closest one flagged `featured`
- `topics[]` — aggregated reads per topic over the last 30 days, with trend delta vs. prior 30
- `wordle` — today's puzzle state from the existing engine: solved status, attempt count, streak, played, win-rate

---

## Design Tokens

```css
/* Color */
--ink:        #0a0a0f;   /* body bg, primary dark */
--ink-soft:   #1a1a22;   /* cards on dark */
--paper:      #f4ede0;   /* primary light, masthead/footer */
--paper-warm: #ebe1d0;   /* (reserved) */
--paper-dim:  #d8ccb4;   /* secondary text on dark */
--rule:       #2a2730;   /* dividers on dark */
--rule-soft:  rgba(244,237,224,0.14); /* faint rules on dark glass */
--accent:     #e8542c;   /* signature coral — kickers, CTAs, focal arcs */
--accent-deep:#b83c1a;
--gold:       #d4a64a;   /* secondary accent — italic emphasis, "aging" */
--cyan:       #4ec5cf;   /* topic accent (JWST) */
--plum:       #8a6dbf;   /* topic accent (Lunar) */
--mute:       #8a8378;   /* tertiary text */

/* Type */
--serif: 'Fraunces', 'Times New Roman', serif;
--sans:  'Space Grotesk', system-ui, sans-serif;
--mono:  'JetBrains Mono', ui-monospace, monospace;
```

**Topic palette** (used in donut + topic list):
- Starship `#e8542c`
- JWST `#4ec5cf`
- Mars `#d4a64a`
- Lunar `#8a6dbf`
- Exoplanets `#7eb09b`
- ISS `#c97b89`

**Type ramp**:
- Display wordmark — Fraunces italic 900, 5.2rem, `font-variation-settings: "opsz" 144`
- Hero headline — Fraunces 600, `clamp(2.6rem, 5.5vw, 5.4rem)`, line-height 0.96, tracking -0.025em
- Section title — Fraunces 500, `clamp(2rem, 3.3vw, 2.9rem)`, line-height 1.05, tracking -0.02em
- Feature headline — Fraunces 500, `clamp(1.5rem, 2.4vw, 2.1rem)`
- Wire headline / orbit row — Fraunces 500, 1.1–1.15rem
- Body deck — Fraunces italic 400, 1.3rem (hero) / Space Grotesk 0.95rem (cards)
- Kicker / nav / meta — JetBrains Mono, 0.62–0.74rem, letter-spacing 0.06–0.18em, uppercase

**Spacing**: section padding `4.5rem 2.5rem`, page horizontal padding `2.5rem`, grid gap `1.4–2rem`, card inner padding `1.4rem`, internal element gaps `0.35rem / 0.5rem / 0.7rem / 1rem / 1.3rem`.

**Border / radius**: rules are `1px solid var(--rule)` on dark, `1px solid var(--ink)` on paper. Pill chips and CTA buttons use `border-radius: 999px`. Cards have square corners; only the hero side card uses 4px.

**Shadows**: none. The design relies on rules + contrast rather than elevation.

**Transitions**: card hovers `0.12–0.18s`, image zoom `0.5s`, donut arc pulse `4–8s` ease, dot pulse `2.4s ease-in-out`.

---

## Assets

- **Article hero images** — production should use the existing app's article image field. The prototype uses Unsplash URLs as placeholders.
- **Astronomical event glyphs** — typeset as Fraunces italic characters (`η`, `♃`, `♄`, `✷`). No icon font required.
- **Iconography** — none beyond Unicode arrows (`↗`, `→`, `●`). The donut chart is hand-drawn SVG (no chart library).
- **Fonts** — Google Fonts: Fraunces (variable), Space Grotesk (400/500/600/700), JetBrains Mono (400/500). Self-host in production for performance.

---

## Files

- `Cosmo Brief - Editorial.html` — full design reference, single-file React prototype. Read this end-to-end as the source of truth; every value in the Design Tokens section above comes directly from its `<style>` block.

The prototype is a single HTML file with inline React via Babel. Component breakdown to mirror in production:

- `Header` — masthead + brand bar + sticky section nav (takes `active` prop)
- `Hero` — full-bleed lead story with overlay + side card
- `SkySection` — 4-card astronomical events strip
- `FeaturedSection` — 2-up long reads
- `PullQuote` — typographic breaker
- `WireSection` — 2-column wire list
- `OrbitSection` — donut + topic list
- `WordleSection` — game promo card
- `Footer` — paper-bg colophon
- `App` — owns the IntersectionObserver and `active` state, renders all sections in order
