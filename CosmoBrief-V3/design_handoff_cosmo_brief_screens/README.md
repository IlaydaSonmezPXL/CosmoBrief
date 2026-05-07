# Handoff: Cosmo Brief — Editorial Refinement of All Screens

## Overview

A continuation of the Cosmo Brief editorial redesign. The original handoff covered the **home / "Edition"** page only; this package extends the same editorial-magazine language to every other surface in the app so nothing reads as "the editorial home" plus "a generic admin / login / archive bolted on."

The five screens covered here are:

1. **Login** — subscriber entrance with editorial hero + auth form
2. **Browse** — full archive: search, topic & status facets, sort, dense newspaper-row list, pagination
3. **Reading Map** — constellation of topics the user has read, with AI-written reflection per topic
4. **Daily Cipher** — full Wordle puzzle page (board, soft hint, stats, archive, share)
5. **Newsroom (Admin)** — Editor's Desk: AI token usage, subscribers, article queue

Every screen reuses the **same masthead, brand bar, sticky tab nav, footer, type ramp, and color tokens** that the home page already uses. The goal is that a subscriber moving between any of these surfaces should feel they are still reading the same publication.

---

## About the Design Files

The HTML/JSX/CSS files in `source/` are **design references** — high-fidelity prototypes built in inline React + Babel for review speed. They are **not** production code to ship as-is.

The task is to **recreate these designs inside the existing Cosmo Brief codebase** using its real component library, routing, styling system, and data layer. The token values (colors, fonts, spacing) are exact and should be lifted directly. The component decomposition can mirror the prototype 1:1 or be adapted to whatever existing patterns the codebase already has (CSS modules, styled-components, Tailwind, etc.).

If the codebase already established shared chrome components (Masthead, BrandBar, TabNav, Footer) for the home page, **reuse them as-is** on these screens — do not duplicate. The five screen-level components below are the new work.

---

## Fidelity

**High-fidelity.** Same fidelity tier as the original home page handoff. Colors, typography, spacing, hover/active states are all intended to match the prototype pixel-faithfully. All design tokens are listed at the bottom of this README; they are identical to the home page's tokens — nothing new was introduced.

Imagery is placeholder; production should use real article hero images and topic data.

---

## Screens / Views

### 1. Login (`source/screens/login.jsx`, `login.css`)

**Purpose**: subscriber sign-in. Two methods: password and magic link. OAuth (Google, GitHub) as alternates. Sign-up CTA at the bottom.

**Layout**:
- `Masthead` (paper) → `BrandBar` (paper, with "Browse public archive" chip on the right) → no sticky tab nav (the user isn't authenticated yet) → main `.login-split` (2-column grid `1.05fr / 1fr`, min-height 820px)
- **Left column (`.login-hero`)**: full-bleed hero image with overlay gradient (same gradient stops as the home hero), kicker + Fraunces 600 headline (italic gold emphasis) + Fraunces italic deck + meta row, sitting in the bottom-left, 3rem padding all around. Bottom-edge mono colophon (edition no., archive count) under a faint rule.
- **Right column (`.login-pane`, ink bg, 3rem 4rem padding)**: form column, max-width 30rem, vertically centered.
  - `§ Subscriber Entrance` section number
  - Fraunces 500 title, max 18ch, with coral italic emphasis on "tonight's"
  - Fraunces italic 1.05rem subdeck
  - **Mode toggle** (`.login-mode`): pill-encased segmented `Password / Magic link` (paper background on active, mono uppercase 0.7rem)
  - **Form**: email field (always shown) + password field (when password mode), each as Fraunces 1.1rem text on a transparent input with bottom rule that goes coral on focus. "Show / Hide" mono affordance inline with the password label. "Forgot password →" mono link below.
  - **Submit**: full-width coral pill, ink text, mono 0.78rem letter-spacing 0.14em, with right-arrow on the right edge. Hover swaps to `--accent-deep` bg + paper text.
  - **Magic-link sent state** (`.login-sent`): replaces the form with a bordered card: kicker → Fraunces 1.1rem confirmation message (email is gold italic), and a "← Use a different address" mono link.
  - **Divider** (`.login-divider`): rule + mono "Or by way of" centered + rule.
  - **OAuth row**: 2-col grid. Each button: outlined pill, mono uppercase, with a Fraunces-italic letterform "G" disc for Google and a `◉` glyph for GitHub. Hover deepens border + adds ink-soft bg.
  - Bottom mono "Issued by Cosmo&Brief Press · Stardate 2026.125" colophon under a rule.

**Behavior**:
- Mode toggle swaps password field visibility and submit copy.
- Magic-link submit shows the "Dispatched" state (no real network). Resend resets it.
- Show/Hide toggles password input type.

---

### 2. Browse (`source/screens/browse.jsx`, `browse.css`)

**Purpose**: archive page. Search, filter by topic + status, sort, paginate.

**Layout**:
- `Masthead` → `BrandBar` (left meta: "The Archive · 247 entries", actions: "Saved (12)", "Reading map") → `TabNav` (active: `browse`)
- **`.browse-head`**: 4rem 2.5rem 2.5rem padding, bottom rule. 2-col grid (`1.4fr / 1fr`).
  - Left: `§ The Archive` section number, Fraunces 500 title with gold italic on "indexed", Fraunces italic deck.
  - Right: 2x2 stat block (`Fraunces italic 2.1rem` numerals over mono 0.7rem labels), separated from left by a left-rule.
- **`.browse-controls`**: 1.6fr / 1fr grid, padding 1.6rem 2.5rem, bottom rule.
  - Search: mono label + Fraunces 1.2rem input on a bottom rule (coral on focus). Clear-X mono button.
  - Sort: mono label + 4 pill buttons (`Most recent`, `Most read`, `Priority`, `A → Z`). Active = paper bg ink text.
- **`.browse-facets`**: padding 1.4rem 2.5rem, bottom rule. Two rows, each `80px / 1fr` grid.
  - Row 1 — Topic chips (`All` 247, `Starship` 38, etc.). Active = coral solid.
  - Row 2 — Status chips (`all`, `fresh`, `aging`, `archived`, `saved`).
  - Chip styling: outlined pill, mono 0.7rem uppercase, with smaller count number after a 0.5rem gap.
- **`.browse-list-wrap`**: padding 2rem 2.5rem 4rem, bottom rule.
  - Meta strip: "{n} entries · filed under <em>{topic}</em>" left, page count right. Mono 0.7rem.
  - **`.browse-row`**: 50px / 110px / 1fr / 130px grid, 1.6rem 0 padding, bottom rule. On hover: `padding-left: 0.5rem`, headline turns coral.
    - Index column: mono "01", "02"… in mute color
    - Thumbnail column: 4:3 placeholder with topic initial in Fraunces italic 1.6rem (in production, real article image)
    - Body: meta line (status pill — fresh=coral, aging=gold, archived=mute) + topic + source + read time, separated by mute "·" dots; Fraunces 500 1.45rem headline; Sans 0.92rem deck (paper-dim)
    - Aside: mono time stamp + Save/Saved pill (gold solid when saved)
  - **Empty state**: dashed card with kicker + paragraph
  - **Pagination**: prev / page indicator (active page is coral with bottom underline) / next

**Data shape**:
```ts
type ArticleRow = {
  id: number;
  topic: string;            // for filter join
  site: string;             // source
  time: string;             // human relative (e.g. "14m", "3h", "2d")
  read: number;             // minutes
  title: string;
  deck: string;             // dek copy
  kicker: "fresh" | "aging" | "archived";
  saved?: boolean;
  letter: string;           // 1-letter fallback for thumb
  img?: string;             // production image url
};
```

**Behavior**:
- Topic chip click → `setTopic(name)` (single-select).
- Status chip click → `setState(name)` (single-select; `saved` filters by `a.saved`).
- Search input fuzzy-includes against `title + deck + topic` (lowercase compare).
- Sort options are visual-only in the prototype; wire to your existing sort.
- Page chevrons + page indicator are visual-only; wire pagination state in production.

---

### 3. Reading Map (`source/screens/reading-map.jsx`, `reading-map.css`)

**Purpose**: visualization of what topics the user has read in 30 days, with an AI-generated reflection per topic.

**Layout**:
- Chrome (Masthead, BrandBar, TabNav active=`map`)
- **`.map-head`**: 4rem 2.5rem 3rem padding, bottom rule. 1.4fr / auto grid.
  - Title: Fraunces 500 with gold italic on "constellation"
  - Right stat block (4 stats): reads · 30d, topics charted, vs prior 30d, avg/day. Left-rule separator.
- **`.map-grid`**: 1.5fr / 1fr 2-column grid, full-width, with right rule on the canvas column.
  - **Left — `.map-canvas`** (radial cyan-tinted bg + concentric guides + crosshair):
    - 600×480 SVG with grid pattern at 60px, 3 concentric dashed circles, axis crosshair.
    - Co-read connecting lines (rule color; coral when either endpoint is selected).
    - Each topic = a star. Position from `(x, y)` on a 0–100 normalized grid (multiplied by 6 / 4.8). Radius scales with `sqrt(count) - magnitude*1.5 + 8`. Outer faint ring + inner solid disc + animated pulsing opacity. Active star gets a soft coral radial glow behind it.
    - Above each star: mono "·22·" count tag. Below: Fraunces italic name (font-size up-shifts from 16 to 20 when active).
    - Click a star → `setActive(topic.id)`.
  - **Right — `.map-panel`** (2.5rem padding, ink bg):
    - **Topic file head**: section-number with topic-tinted dot, Fraunces italic 2.6rem topic name in topic color, 3-stat row (reads, trend pill, threads).
    - **AI essay card** (`.map-essay`, ink-soft bg + rule): kicker "AI reflection · drafted 14:02", Fraunces 1.4rem title, Fraunces 1.02rem summary, "Worth noting" bullet list (coral bullet glyph), footer with word count + "Re-draft →" button.
    - **Threads list** (`.map-threads`): mono header, then numbered rows (`01` mono / Fraunces label / mono count), each on a rule.
- **`.map-strip`**: full-width strip at bottom (3rem 2.5rem). Kicker "All topics — pick to inspect", then a ruled list of all topics.
  - Each row = button: 14px swatch / Fraunces name / progress bar (background rule, fill in topic color, scaled to count) / mono count / trend pill (up=coral, down=gold, flat=mute).
  - Hover = `padding-left: 0.5rem`. Active row gets ink-soft bg.

**Data shape**:
```ts
type MapTopic = {
  id: string; name: string; color: string;
  count: number; trend: string;            // "+8" | "−1" | "0"
  x: number; y: number;                    // 0–100, position on the constellation
  mag: 1 | 2 | 3;                          // brightness/size class
  subjects: string[];                      // threads in this topic file
};
type MapEssay = {
  title: string; words: number;
  summary: string;
  points: string[];                        // bullet points
};
type MapLink = [topicIdA: string, topicIdB: string];
```

**Behavior**:
- Star click + bottom-strip row click both call `setActive(topic.id)`.
- Selected star: highlighted with glow + larger label; connected lines drawn coral.
- Topic file panel + AI essay re-render on selection.
- "Re-draft →" should call your AI re-generation endpoint.

---

### 4. Daily Cipher (`source/screens/cipher.jsx`, `cipher.css`)

**Purpose**: full-screen page for the daily 5-letter Wordle. Working game + soft hint + stats + past-puzzle archive + share.

**Layout**:
- Chrome (active=`wordle`)
- **`.cipher-head`**: centered, 50rem max width. Section-number, Fraunces 500 title with coral italic on "One", a 60×2px coral rule, mono+serif deck explaining 00:00 UTC drop and streak rules.
- **`.cipher-main`**: 1.3fr / 1fr 2-col grid, right rule on the stage.
  - **Stage column**:
    - Mono meta row: `Cipher · 0117 · Attempt N of 6 · Open|Solved`
    - **Board**: 6 rows × 5 tiles, 64×64px each, gap 6px. Tile states:
      - `empty` — ink-soft bg, rule border, transparent text
      - `typing` — paper-dim border, Fraunces italic 600 letter visible (small pop animation)
      - `correct` — coral fill, ink text
      - `present` — gold-tinted bg `rgba(212,166,74,0.18)`, gold text + border
      - `absent` — ink fill, rule border, mute text
    - Input row: mono outlined input (italic placeholder) + coral submit pill (disabled until 5 chars).
    - **On-screen keyboard** (3 rows, last row gets wide `Enter` + `Del` buttons). Keys colored after submission using best-state-wins logic.
  - **Side column** (3rem 2.5rem):
    - **Soft hint card** (`.cipher-clue`): kicker + Fraunces italic 1.25rem hint, signed "— The Editor".
    - **Stats block**: header "Your record", 2x2 stat grid (streak, played, win rate, avg attempts), then attempt-count distribution bars (mono numeral / horizontal bar with coral fill + count overlay).
    - **Past puzzles list**: numbered rows `No. 0116 / P L U M E / 4/6` (winning attempts in coral, miss in gold "X/6"), with "See full archive →" link.
    - **Share** (`.cipher-share`): coral pill "Share result →" with translateX hover; mono caption.

**Game logic**:
- `SOLUTION` is hard-coded to `"ORBIT"` in the prototype. In production, fetch today's word from your puzzle engine.
- `buildRow(guess, solution)` (in the JSX) does standard 2-pass Wordle scoring: pass 1 marks `correct` and reserves those solution slots; pass 2 marks `present` only against unused solution slots, otherwise `absent`. Reuse this exact logic — it correctly handles duplicate letters.
- Submit guards: must be 5 chars, not won, fewer than 6 prior guesses.
- Keyboard letter state uses rank `correct(3) > present(2) > absent(1)` so a later best-state replaces an earlier worse one.

**Behavior**:
- On-screen keyboard click + physical keyboard `Enter` both submit. `Del` clears last char.
- Disable input + submit when `guesses.includes(SOLUTION) || guesses.length >= 6`.
- `Share result →` should copy the tile pattern (3 rows of emoji squares mapping to states) — wire to your existing share helper.

---

### 5. Newsroom / Admin (`source/screens/admin.jsx`, `admin.css`)

**Purpose**: staff-only "Editor's Desk." Three primary panels: token usage, subscribers, article queue. Plus a custom masthead variant ("Newsroom · Editor's Desk" instead of an edition number) and a custom tab nav (`Desk / Subscribers / Token usage / Article queue / Feeds / Settings`).

**Layout**:
- Custom Masthead: left = "Newsroom · Editor's Desk" + "Internal · Tuesday, May 5, 2026"; right = uptime weather-pill + "Logout"
- BrandBar: meta = "The Newsroom · staff entrance" / "7 active staff · 2,419 archived"; actions = "Public site →" + coral "+ New brief" chip; avatar shows admin initial.
- Custom TabNav (`admin-tabs` class) with admin items; the prototype keeps all panels mounted on a single page (the tab state is purely for visual emphasis). In production, route them.
- **`.admin-head`**: 1.3fr / 1.4fr grid. Left: section-number, Fraunces 500 title with gold italic on "edition", Fraunces italic deck. Right: 4 stat cards in a row — each is an ink-soft outlined block with mono label / Fraunces italic 2rem numeral / mono trend (coral=up, gold=down).
- **`.admin-col` × 3** (each is a section, padded 4rem 2.5rem, bottom rule). Each `.admin-col-head` has a section-number + Fraunces 500 col title + right-aligned mono meta block.

**§ 01 — Token usage**:
- **`.admin-meter`**: full-width 56px-tall bar split into 4 colored segments (coral=explanations, gold=summaries, cyan=cipher, plum=emails). Each segment shows mono label `1.01M` etc. Below: 5-item legend with swatch + label including remaining slice.
- **Tokens table** (`.tokens-table`): columns Surface / Model / Calls 30d / Avg tokens / Spend / Trend. Mono uppercase headers, Sans 0.92rem body, mono numerics right-aligned. Trend is a colored pill.

**§ 02 — Subscribers**:
- **`.admin-user-filters`**: pill row (`all`, `active`, `trial`, `lapsed`) — active = coral solid. Spacer + outlined search pill (`Find` mono label + Fraunces input).
- **Users table** (`.users-table`): columns avatar / Reader (name + mono email) / Plan (colored pill: annual=coral, monthly=gold, trial=cyan, expired=mute, staff=plum) / Reads / Tokens / Last seen / Status / Action ("Note →" or "Re-engage →"). Lapsed rows get a faint coral background tint.

**§ 03 — Article queue**:
- **`.admin-queue-list`**: numbered rows (50px qnum / body / 100px priority pill / 80px action). Body: mono meta line (status pill: live=coral, ready=gold, draft=mute, review=cyan; topic; source) + Fraunces 1.2rem title. Priority pill: `lead` = coral solid, `high` = coral outline, `med` = gold, `low` = mute.

**Data shapes**:
```ts
type AdminUser = {
  id: number; initial: string;
  name: string; email: string;
  role: "admin" | "editor" | "subscriber";
  status: "active" | "trial" | "lapsed";
  plan: "annual" | "monthly" | "trial" | "expired" | "staff";
  joined: string; last: string;     // human relative
  reads: number; tokens: number;
};
type QueueItem = {
  topic: string; title: string; source: string;
  status: "live" | "ready" | "draft" | "review";
  priority: "lead" | "high" | "med" | "low";
};
```

**Behavior**:
- Tab click → `setPane(id)`. Production: route, do not co-mount.
- Filter chips → `setFilter("all"|"active"|"trial"|"lapsed")` and filter the user array.
- Row "Note →" / "Re-engage →" should open the existing follow-up composer.

---

## Shared Chrome (do not duplicate if home page already ships it)

All 5 screens consume these. They are defined in `source/editorial-chrome.jsx` and styled in `source/editorial-shared.css`. **If your codebase already has these from the home-page handoff, reuse those.**

- `<CBMasthead>` — paper-bg, 0.55rem 2.5rem padding, mono 0.72rem uppercase. Left: edition string + greyed live date (re-renders every 60s). Right: weather pill + "Subscribe".
- `<CBBrandBar>` — paper-bg, 1.6rem 2.5rem 1.4rem padding, 1fr / auto / 1fr 3-col grid ending-aligned. Left: stat lines (`brand-meta`). Center: Fraunces italic 900 5.2rem `Cosmo&Brief` wordmark with coral `&`. Right: outlined pill `cb-chip`s + 30px ink avatar.
- `<CBTabNav>` — sticky ink bar, mono 0.72rem uppercase, gap 1.7rem. Active link gets coral underline + paper text. Right side: pulsing coral dot + "Updated N minutes ago". Tab items: `edition / browse / map / wordle / admin` (admin uses its own custom tab list).
- `<CBFooter>` — paper bg, 4-col grid (1.4fr 1fr 1fr 1fr), 3rem 2.5rem 1.5rem padding, top ink rule. Col 1 wordmark + tagline; cols 2-4 link lists under mono header. Bottom row spans all 4 with copyright + stardate.

---

## Design Tokens (identical to home page)

```css
/* Color */
--ink:        #0a0a0f;
--ink-soft:   #1a1a22;
--ink-softer: #232330;
--paper:      #f4ede0;
--paper-warm: #ebe1d0;
--paper-dim:  #d8ccb4;
--paper-mute: #6b6358;
--rule:       #2a2730;
--rule-soft:  rgba(244,237,224,0.14);
--accent:     #e8542c;     /* coral — primary CTAs, "fresh", correct tile, lead pill */
--accent-deep:#b83c1a;
--gold:       #d4a64a;     /* italic emphasis, "aging", present tile, down trend */
--cyan:       #4ec5cf;     /* JWST topic, trial plan, review status */
--plum:       #8a6dbf;     /* Lunar topic, staff plan, digest segment */
--green:      #7eb09b;     /* Exoplanets topic */
--rose:       #c97b89;     /* ISS topic */
--mute:       #8a8378;     /* tertiary text */

/* Type */
--serif: 'Fraunces', 'Times New Roman', serif;
--sans:  'Space Grotesk', system-ui, sans-serif;
--mono:  'JetBrains Mono', ui-monospace, monospace;
```

**Topic palette** (Reading Map + admin):
- Starship `#e8542c`, JWST `#4ec5cf`, Mars `#d4a64a`, Lunar `#8a6dbf`, Exoplanets `#7eb09b`, ISS `#c97b89`

**Type ramp** (these are the screens' specific reuses; full ramp is in the home-page handoff):
- Page title: Fraunces 500, `clamp(2.4rem, 4vw, 3.6rem)`, line-height 1.02, tracking -0.025em, gold italic emphasis
- Section title: Fraunces 500, `clamp(1.8rem, 2.8vw, 2.4rem)`, coral italic emphasis
- Body deck: Fraunces italic 400, 1.05–1.2rem, paper-dim
- Card body: Space Grotesk 0.92rem, line-height 1.5
- Numerals: Fraunces italic 500, 1.6–2.1rem
- Mono labels: JetBrains Mono 0.62–0.74rem, letter-spacing 0.10–0.18em, uppercase

**Spacing**:
- Page horizontal padding: 2.5rem
- Section vertical padding: 4rem (header), 4rem 2.5rem (`.admin-col`), 3rem 2.5rem (lighter strips)
- Card inner padding: 1.4–1.6rem
- Grid gaps: 0.7rem (chip rows), 1.4–2rem (column gaps), 4rem (head split)

**Border / radius**:
- Rules: `1px solid var(--rule)` on dark, `1px solid var(--ink)` on paper
- Pill chips, CTA buttons, status pills: `border-radius: 999px`
- Cards/tiles/inputs: square corners (only `.cipher-tile` is square; only the home-hero side card uses 4px)

**Shadows**: none. Hierarchy comes from rules + contrast.

**Transitions**: 0.12–0.18s on hover state changes; 0.15s on chip toggles; 0.2s on Wordle tile state; pulsing `--live-dot` 2.4s; constellation arc opacity 4–8s.

---

## Interactions & Behavior — global

- All hover/active states match the home page's vocabulary: pill chips invert, list rows slide right 0.5rem and headline turns coral, CTA buttons swap to deep-coral with paper text.
- Coral is the **only** affirmative-action color. Gold is for emphasis / "in-progress" states, never CTAs.
- No drop shadows; no gradients except hero overlays.
- Single responsive breakpoint at 980px (matching home page) — collapse 2-col splits to 1-col, drop right-side stat blocks below the headers, hide the Reading Map's bottom strip's progress bar column.

---

## State Management — per screen

| Screen | State |
|---|---|
| Login | `mode: "password"\|"magic"`, `email`, `password`, `showPw`, `sent` |
| Browse | `topic`, `state` (status), `sort`, `q` (search). `filtered` = derived `useMemo`. |
| Reading Map | `active: topicId`. Selected topic + AI essay derived. |
| Cipher | `guesses: string[]`, `current: string`. Win + keyboard letter state derived. |
| Admin | `pane: tabId`, `filter: status`. Filtered users derived. |

Wire each to your existing data layer / routes:
- Login → your auth endpoint(s)
- Browse → SNAPI / archive query
- Reading Map → reading-history aggregator + AI explanation endpoint
- Cipher → existing puzzle engine + share helper
- Admin → admin REST/GraphQL endpoints

---

## Files

`source/`
- `editorial-shared.css` — design tokens + masthead/brand-bar/tab-nav/footer/section/pill/placeholder styles
- `editorial-chrome.jsx` — `CBMasthead`, `CBBrandBar`, `CBTabNav`, `CBFooter` components
- `screens/login.jsx` + `login.css`
- `screens/browse.jsx` + `browse.css`
- `screens/reading-map.jsx` + `reading-map.css`
- `screens/cipher.jsx` + `cipher.css`
- `screens/admin.jsx` + `admin.css`
- `Cosmo Brief — Editorial system.html` — design canvas wrapper that mounts all 5 screens side-by-side. Useful for A/B reference. **Do not ship this file.** It uses inline React + Babel and a `DesignCanvas` component (from the prototyping environment) that is not part of the production app.

---

## Production decomposition

Suggested component tree to mirror in your codebase. Names are advisory:

```
<EditorialShell>          // Masthead + BrandBar + TabNav + Footer
  <LoginPage>             // /login
    <LoginHero/>
    <LoginPane>
      <ModeToggle/>
      <PasswordForm/>     // when mode==password
      <MagicLinkForm/>    // when mode==magic
      <OAuthRow/>
    </LoginPane>
  </LoginPage>

  <BrowsePage>            // /browse
    <BrowseHead/>
    <BrowseControls/>     // search + sort
    <BrowseFacets/>       // topic + status chip rows
    <BrowseList items/>   // virtualize if archive grows
    <Pagination/>
  </BrowsePage>

  <ReadingMapPage>        // /map
    <MapHead/>
    <MapCanvas topics links active onSelect/>
    <MapPanel topic essay/>
    <MapStrip topics active onSelect/>
  </ReadingMapPage>

  <CipherPage>            // /cipher (or /wordle)
    <CipherStage>
      <Board rows/>
      <InputRow/>
      <Keyboard letterState onKey/>
    </CipherStage>
    <CipherSide>
      <ClueCard/>
      <StatsBlock/>
      <ArchiveList/>
      <ShareButton/>
    </CipherSide>
  </CipherPage>

  <AdminPage>             // /admin (gated)
    <AdminHead stats/>
    <TokenUsageSection/>
    <SubscribersSection/>
    <ArticleQueueSection/>
  </AdminPage>
</EditorialShell>
```

Routing should be flat under the editorial shell — switching between screens should never re-mount the masthead/footer chrome (the editorial feel depends on those staying put).

---

## Notes

- The home page's existing IntersectionObserver scroll-spy pattern is **not** used on these screens; tab nav here is route-based, not scroll-based.
- Admin gating is up to your auth layer. The prototype renders the page unconditionally for review purposes.
- The Daily Cipher's `SOLUTION = "ORBIT"` is hard-coded for review; replace with your puzzle source on day 0.
- All AI essay copy in the Reading Map is placeholder; production should call your AI endpoint with a topic + 30-day reading history payload and stream the result into the same essay layout.
- All article/user/queue content is fictional placeholder. Wire to real data sources.
