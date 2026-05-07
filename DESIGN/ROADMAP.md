# UI Feature Roadmap

Planned and discussed UI additions. Each entry notes what it replaces/adds, scope, and any decisions already made.

---

## V2 Editorial Redesign

**Status:** Done — implemented 2026-05-05

### What it is
Complete visual overhaul of the home page (`/`) to an editorial/newspaper magazine layout. Design reference in `CosmicBrief-V2/design_handoff_cosmo_brief_editorial/`. Same data and features, new presentation.

### Route changes
- `/` → `Home.tsx` (V2 editorial scroll page)
- `/browse` → `Feed.tsx` (existing paginated article feed, now accessible from brand bar + nav)
- All other routes (`/articles/:id`, `/reading-map`, `/wordle`, `/admin`) unchanged, keep existing dark Nav

### Sections (Home page — single scroll)
1. **Masthead** — paper bg, mono font, edition number + live date
2. **Brand bar** — `Cosmo&Brief` Fraunces 900 wordmark, article count stats, nav chips (Browse / Map / Wordle), UserMenu avatar
3. **Sticky section nav** — ink bg, IntersectionObserver active state, "Updated Xm ago" live indicator
4. **Hero** — full-bleed lead article image, Fraunces headline, deck, "Read the brief →", side card showing next sky event
5. **Tonight's Sky** — 4 poster-style cards from AstronomicalEvents API, first card featured (coral), location change inline
6. **Long Reads** — 2-up feature grid, articles 2–3 preferring those with images
7. **Pull Quote** — rotating daily space quote (7 quotes, keyed by day-of-year)
8. **The Wire** — compact 2-col grid of remaining articles (up to 17), Wire headline turns coral on hover
9. **Reading Orbit** — SVG donut chart (arcs = topic read counts) + topic table with rank-based trend indicators
10. **Daily Cipher** — Wordle promo: shows stats from localStorage + mini board (real today's game if played, else decorative pattern), CTA → `/wordle`
11. **Footer** — paper bg, 4-col magazine colophon, stardate, sign-out

### Design tokens
New `--ed-*` variables defined on `.editorial` (home) and `.ed-light` (secondary pages) wrappers, isolated from existing dark theme system. Fraunces (serif) + JetBrains Mono added to Google Fonts; Orbitron kept for Wordle/ReadingMap/Admin. Existing 4 dark themes unaffected (apply to Wordle, ReadingMap, Admin only now).

---

## V3 Editorial Extension — All Screens

**Status:** Done — implemented 2026-05-05

Design reference: `CosmoBrief-V3/design_handoff_cosmo_brief_screens/`

### What it is
Extends the V2 editorial language to all remaining screens so the entire app reads as one publication, not a V2 home bolted onto generic admin/login pages.

### Shared chrome
`EditorialShell.tsx` — single component wrapping every route: Masthead (edition no., live date, location pill) + BrandBar (live article stats, `Cosmo·Brief` wordmark, auth-conditional action chips) + sticky route-based TabNav (ink bar, coral active underline, live update indicator) + Footer (4-col magazine colophon). Auth-conditional: chips and TabNav hidden for unauthenticated users.

### Screens rebuilt to V3 spec
- **Login** — split-pane: editorial hero left + ink form pane right; `§ · Subscriber Entrance`; username + password only
- **Register** — same template; `§ · New Subscription`
- **Browse** (`/browse`) — V3 dense newspaper rows (index + thumb + body + aside grid); topic facet row (derives from topic_tags via `GET /articles/topics`); state + freshness facets; search; pagination
- **Reading Map** (`/reading-map`) — SVG `viewBox="0 0 600 480"` with grid pattern (60px), 3 concentric dashed circles, crosshair; stars sized by `8 - mag*1.5 + sqrt(count)`; outer ring + inner solid + SVG `<animate>` pulsing; count label `·NN·` above, italic name below; active star: coral radial glow; topic-colored panel with 3 stats + threads list
- **Daily Cipher** (`/wordle`) — V3 board + keyboard layout; editorial clue card in side panel (context-aware flavor text, "— The Editor"); stats + distribution + past puzzles + share unchanged
- **Admin / Newsroom** (`/admin`) — V3 Newsroom Desk: 4-stat header grid + token meter (prompt vs completion bar) + subscribers table (from `GET /admin/users`) + signal queue (article cache, freshness status)

### New backend endpoints (bonus, not in core spec)
- `GET /articles/topics` — top 20 tags with distinct article counts; authenticated
- `GET /articles?topic=X` — filter articles by topic tag via subquery into topic_tags
- `GET /admin/users` — admin-gated; returns all users with explanation counts

### CSS
All V3 styles in `frontend/src/editorial-v3.css` (separate from `index.css`). Tokens: `--ink`, `--paper`, `--accent` (coral), `--gold`, `--cyan`, `--mute` scoped to `.cb-root`. No changes to existing dark theme or V2 editorial CSS.

### Brand symbol
`Cosmo·Brief` — middle dot (U+00B7) replaces the `&` ampersand. More fitting as an editorial interpunct for a compound brand name. CSS class `.sep` (was `.amp`).

---

## V2 Secondary Pages Redesign

**Status:** Superseded by V3 — 2026-05-05

V2 secondary page styles (EdNav, `.ed-light`, `.ed-article-row`, etc.) remain in `index.css` for reference. The V3 `EditorialShell` now handles all pages. `EdNav.tsx` is kept but no longer used by any active route.

---

## Astronomical Events Widget

**Status:** Done — implemented 2026-05-05
**Location:** Feed page (`/`), between the filter bar and the article list

### What it is
Horizontal scrollable card strip showing upcoming astronomical events tailored to the user's location. Each card shows: event type (icon + label), name, date, time hint ("after midnight", "this evening"), compass direction + altitude where applicable, a short description, and a "+ Calendar" link.

### Data sources
- **Curated annual list** (backend): 9 meteor showers, 4 solstices/equinoxes, 2 fixed 2026 eclipses. Filtered to next 90 days, sorted by date.
- **AstronomyAPI** (live, location-specific): Tonight's planets (Mercury, Venus, Mars, Jupiter, Saturn) with altitude + azimuth — only planets ≥ 10° above horizon are shown. Proxied through backend to keep API key off the client.

### Location flow
1. Check `localStorage` key `cosmo_location` — use saved if present.
2. If none: browser `navigator.geolocation.getCurrentPosition` — save result.
3. If denied: show city-name input. Geocoded via Nominatim (OpenStreetMap, free, no key). Saved to `localStorage`.
4. User can "Change" location at any time via the location bar.

### Google Calendar
Each card has a "+ Calendar" anchor that opens `calendar.google.com/calendar/render?action=TEMPLATE&…` pre-filled. No OAuth, no credentials.

### Card type accents
- Meteor shower → `--accent-cyan` left border
- Planet → `--accent` left border
- Eclipse → `--accent-gold` left border
- Solstice/Equinox → `--accent-purple` left border

### Ansible / vault
`ASTRONOMY_APP_ID` and `ASTRONOMY_APP_SECRET` injected via `cosmobrief.env.j2`. Values come from `vault_astronomy_app_id` and `vault_astronomy_app_secret` in `ansible/vault.yml`.

---

## Space Wordle

**Status:** Done — implemented 2026-05-04  
**Location:** Separate tab alongside Reading Map (`/wordle` route)

### What it is
Standard Wordle mechanics (6 guesses, 5-letter word, color tile feedback) using a space/astronomy word list. Daily word rotates deterministically by day-of-year. Word list served from the backend (`GET /wordle/words`), seeded into PostgreSQL by Ansible.

### Word list
94 five-letter space words seeded via `ansible/roles/storage/tasks/seed_wordle.yml`. Examples:
`ORBIT`, `COMET`, `VENUS`, `PLUTO`, `TITAN`, `SPACE`, `SOLAR`, `PROBE`, `DWARF`, `FLARE`, `ATLAS`, `LASER`, `LUNAR`, `RINGS`...

### Tile colors
Match the existing badge palette:
- Correct position → `--accent-cyan` (`#22d3ee`)
- Wrong position → `--accent-gold` (`#f59e0b`)
- Not in word → `--bg-elevated` with `--text-muted`

### What was implemented
- New backend: `wordle_words` table (migration `f6a1b2c3d4e5`), `WordleWord` model, `GET /wordle/words` router, `WordleWordsResponse` schema
- New Ansible: `seed_wordle.yml` task (idempotent), play 4 in `playbook.yml` calls both `seed_admin.yml` and `seed_wordle.yml`
- New frontend: `frontend/src/pages/Wordle.tsx`, `frontend/src/api/wordle.ts`, `/wordle` route in `App.tsx`, nav link in `Nav.tsx`
- Both `/reading-map` and `/wordle` routes coexist — Reading Map was kept alongside Wordle

---

## Wordle Scoreboard

**Status:** Done — implemented 2026-05-05
**Location:** Stats modal in `Wordle.tsx`, "Stats" button below keyboard

### What it is
Standard Wordle statistics modal: 4 stat boxes (Played, Win %, Current Streak, Best Streak) + horizontal guess distribution bar chart (1–6 guesses). Auto-opens 1.5 s after game ends; reopenable anytime via "Stats" button. Share button copies emoji grid to clipboard.

### Streak rules
- Win = streak + 1 (only if last win was yesterday — daily streak, not consecutive-wins)
- Lose = streak resets to 0
- Skip a day = streak shown as 0 on next load (`getDisplayStreak` checks `lastWonDate` vs today/yesterday)

### Storage
localStorage key `wordle_stats_${userId}` — `{ played, won, currentStreak, maxStreak, lastWonDate, lastPlayedDate, distribution: {1–6, 0} }`. `lastPlayedDate` guard prevents double-counting on re-open. Per-user keying: different accounts never share stats.

### Share output
```
Space Wordle — May 5, 2026
3/6

⬛🟨⬛🟩⬛
🟩🟨⬛🟩⬛
🟩🟩🟩🟩🟩
```
Standard 🟩🟨⬛ emojis — recognizable outside the app.

### Design decisions
- Distribution bar: width scales to max bar (not fixed 100%); min 7% so zero-bars stay visible
- Current guess highlighted with `--accent-cyan` glow on its bar
- Overlay click-outside dismisses; keyboard Escape not needed (modal is simple)
- No backend changes — localStorage consistent with daily game state pattern

---

## Reading Map — Alternative Implementation

**Status:** Implemented as interactive SVG constellation (2026-05-04)

Reading Map rewritten as interactive SVG — topic stars sized by article count, constellation lines between nearest neighbors, click-to-expand article panel. Both `/reading-map` and `/wordle` routes are active. Reading Map populates from AI explanation topic tags.

---

## User Menu

**Status:** Done — implemented 2026-05-04
**Location:** Right side of Nav, replaces the "Sign out" button

### What it is
Dropdown triggered by `[●] username ▾` button. Three sub-views rendered inside the dropdown:

1. **Menu** (default) — username header, Settings button, Account button, Sign out (separated, red-tinted)
2. **Settings** — 4 accent color theme swatches (Space Blue/Nebula/Aurora/Solar), wipe-all-data with inline confirmation
3. **Account** — shows current email + member-since; form to update username, email, password (all require current password)

### Theme system
- `data-theme` attribute set on `<html>` element
- Persisted in `localStorage` as `cosmo_theme`
- Initialized before React renders (in `main.tsx`) — no flash on reload
- Each theme changes `--bg`, `--bg-rgb`, `--bg-card`, `--bg-card-hover`, `--bg-elevated`, `--border`, `--border-mid`, `--accent`, `--accent-rgb`, `--accent-light`, and the `body::before` nebula glow — the entire site shifts color
- Semantic colors (`--accent-cyan`, `--accent-gold`, `--accent-purple`) stay fixed — badge and Wordle tile colors are unaffected
- Nav frosted glass uses `rgba(var(--bg-rgb), 0.92)` so the tint follows the active theme

### API changes
- `TokenResponse` now includes `username`; stored in `localStorage`
- `GET /users/me` — fetch current user info (email, created_at)
- `PATCH /users/me` — update username/email/password (requires current password)
- `DELETE /users/me/data` — wipes article_states, topic_tags, explanations; frontend also clears wordle localStorage

---

## Adding New Pages

When adding a new page/route:

1. Create `frontend/src/pages/NewPage.tsx`
   - Wrap in `<div className="page"><Nav /><div className="container">…`
   - Use `page-header` / `page-title` / `page-subtitle` for the header
2. Add route in `frontend/src/App.tsx` inside `<PrivateRoute>` (or public if needed)
3. Add nav link in `frontend/src/components/Nav.tsx` with `className="nav-link"`
4. Run `npm run build` — zero TypeScript errors required before deploying
