# UI Feature Roadmap

Planned and discussed UI additions. Each entry notes what it replaces/adds, scope, and any decisions already made.

---

## Space Wordle

**Status:** Planned — not started  
**Replaces:** Reading Map tab (`/reading-map` route + nav link)

### What it is
Standard Wordle mechanics (6 guesses, 5-letter word, color tile feedback) using a space/astronomy word list. Daily word rotates deterministically by day-of-year — no backend needed.

### Word list (agreed direction)
All 5-letter space words. Examples:
`ORBIT`, `COMET`, `VENUS`, `PLUTO`, `TITAN`, `SPACE`, `SOLAR`, `PROBE`, `DWARF`, `FLARE`, `ATLAS`, `QUARK`, `LASER`, `LUNAR`, `NOVA_` (padded), `BLACK`, `NEBUL` (truncated), `RINGS`, `CRTER`...

Full canonical list to be finalized before implementation.

### Tile colors
Match the existing badge palette:
- Correct position → `--accent-cyan` (`#22d3ee`)
- Wrong position → `--accent-gold` (`#f59e0b`)
- Not in word → `--bg-elevated` with `--text-muted`

### Scope
- New page: `frontend/src/pages/Wordle.tsx`
- Update `App.tsx`: replace `/reading-map` → `/wordle`
- Update `Nav.tsx`: "Reading Map" link → "Wordle"
- Zero backend changes; Reading Map API endpoint stays (just no UI)

---

## Reading Map — Alternative Implementation

**Status:** Discussed, not committed

Current reading map only populates when AI explanations are requested. Two alternative approaches discussed:

| Option | How | Effort |
|---|---|---|
| Tag from `news_site` | On state→read transition, write `TopicTag(tag=news_site)` | ~5 lines in `articles.py` |
| Keyword extraction | Match title/summary against space keyword list, no LLM | Medium — needs wordlist + extraction logic |

Decision deferred until Wordle replaces the tab.

---

## Adding New Pages

When adding a new page/route:

1. Create `frontend/src/pages/NewPage.tsx`
   - Wrap in `<div className="page"><Nav /><div className="container">…`
   - Use `page-header` / `page-title` / `page-subtitle` for the header
2. Add route in `frontend/src/App.tsx` inside `<PrivateRoute>` (or public if needed)
3. Add nav link in `frontend/src/components/Nav.tsx` with `className="nav-link"`
4. Run `npm run build` — zero TypeScript errors required before deploying
