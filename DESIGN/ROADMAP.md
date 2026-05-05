# UI Feature Roadmap

Planned and discussed UI additions. Each entry notes what it replaces/adds, scope, and any decisions already made.

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
