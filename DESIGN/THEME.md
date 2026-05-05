# Design Theme

Space/astronomy dark theme. All tokens live in `frontend/src/index.css` as CSS custom properties.

---

## Color Tokens

Tokens marked **theme-swappable** are overridden per theme. All others are global constants.

| Token | Default value | Usage |
|---|---|---|
| `--bg` | `#07090f` | Page background — **theme-swappable** |
| `--bg-rgb` | `7, 9, 15` | RGB of `--bg` for `rgba()` — **theme-swappable** |
| `--bg-card` | `#0c1120` | Card surfaces — **theme-swappable** |
| `--bg-card-hover` | `#101828` | Card hover state — **theme-swappable** |
| `--bg-elevated` | `#131d2e` | Elevated panels (explanation, history) — **theme-swappable** |
| `--border` | `#1a2540` | Default borders — **theme-swappable** |
| `--border-mid` | `#243354` | Medium-emphasis borders, input focus — **theme-swappable** |
| `--accent` | `#4f9cf9` | Primary CTA, links, active states — **theme-swappable** |
| `--accent-rgb` | `79, 156, 249` | RGB of `--accent` for `rgba()` — **theme-swappable** |
| `--accent-light` | `#6aabff` | Lighter accent for hover states — **theme-swappable** |
| `--accent-purple` | `#8b5cf6` | "read" badge — **fixed** |
| `--accent-cyan` | `#22d3ee` | "fresh" badge, Wordle correct tile — **fixed** |
| `--accent-gold` | `#f59e0b` | "aging" badge, Wordle present tile — **fixed** |
| `--text` | `#dde3f0` | Primary text |
| `--text-sec` | `#7e8fa8` | Secondary / body text |
| `--text-muted` | `#3f4e66` | De-emphasized labels, metadata |
| `--fresh` | `#22d3ee` | Freshness: fresh (< 48 h) |
| `--aging` | `#f59e0b` | Freshness: aging (48–96 h) |
| `--archived` | `#5a6478` | Freshness: archived (> 96 h) |

---

## Themes

User-selectable via Settings → theme swatches. Each theme shifts the entire site: background, cards, borders, nav frosted glass, and ambient nebula glow. Semantic colors (`--accent-cyan`, `--accent-gold`, `--accent-purple`) stay fixed — badge and Wordle tile colors are unaffected.

| Theme | `--bg` | `--accent` | Nebula glow | `data-theme` |
|---|---|---|---|---|
| Space Blue (default) | `#07090f` | `#4f9cf9` | cyan + purple | `""` (absent) |
| Nebula | `#080610` | `#8b5cf6` | all purple | `nebula` |
| Aurora | `#04090d` | `#22d3ee` | all cyan | `aurora` |
| Solar | `#0d0800` | `#f59e0b` | all amber | `solar` |

**Implementation:** `data-theme` attribute on `<html>`. Persisted in `localStorage` as `cosmo_theme`. Applied before React mounts in `main.tsx` to prevent flash on reload. Nav background uses `rgba(var(--bg-rgb), 0.92)` so the frosted glass tint follows the theme.

---

## Typography

**Body font:** Space Grotesk (Google Fonts), fallback `system-ui, -apple-system, sans-serif`.  
**Display font:** Orbitron (Google Fonts) — used only for page titles, detail titles, auth titles, nav brand, stat values, section labels, Wordle tiles/keys.

| Use | Font | Size | Weight |
|---|---|---|---|
| Page title | Orbitron | `1.3rem` | 700 |
| Detail title | Orbitron | `1.3rem` | 700 |
| Auth title | Orbitron | `1.2rem` | 700 |
| Nav brand | Orbitron | `0.95rem` | 700 |
| Stat values | Orbitron | `1.8rem` | 700 |
| Section labels | Orbitron | `0.65rem` | 700 |
| Body | Space Grotesk | `0.9rem` | 400 |
| Article title | Space Grotesk | `0.95rem` | 600 |
| Labels / badges | Space Grotesk | `0.68rem` | 700, uppercase |
| Meta / muted | Space Grotesk | `0.78–0.82rem` | 500 |

---

## Spacing & Shape

| Token | Value |
|---|---|
| `--radius` | `8px` (cards, panels) |
| `--radius-sm` | `5px` (badges, inputs, small buttons) |
| Nav height | `56px` |
| Container max-width | `860px` (default), `440px` (sm) |
| Container padding | `2rem 1.5rem` |

---

## Badge Colors

Badges use translucent backgrounds — `rgba(r,g,b, 0.12)` fill + `rgba(r,g,b, 0.25)` border — so they layer cleanly over any card surface.

| Class | Color |
|---|---|
| `.badge-fresh` | cyan (`--fresh`) |
| `.badge-aging` | amber (`--aging`) |
| `.badge-archived` | gray (`--archived`) |
| `.badge-new` | blue (`--accent`) |
| `.badge-read` | purple (`--accent-purple`) |
| `.badge-explained` | cyan (`--accent-cyan`) |

---

## Nav

Sticky, `position: sticky; top: 0`. Background `rgba(var(--bg-rgb), 0.92)` with `backdrop-filter: blur(20px)` for frosted glass — tint follows active theme. Border bottom uses `--border`.

---

## Background

Flat dark `--bg` base. Two `body` pseudo-elements add ambient depth:

- `body::before` — fixed nebula glow (three radial gradients). Default: cyan bottom-left, purple top-right, blue center. Overridden per theme: Nebula = all purple, Aurora = all cyan, Solar = all amber. `pointer-events: none`.
- `body::after` — fixed star field (24 `radial-gradient` dots: 16 white, 1 theme-accent, 3 fixed-color, 4 extra white). Animates via `@keyframes twinkle` (6 s ease-in-out infinite). `pointer-events: none`.

Both sit at `z-index: 0`; `.page` and `.auth-page` are `position: relative; z-index: 1`.

---

## Design Principles

1. **Dark first** — every new component starts from `--bg-card`, not white
2. **Translucent over solid** — badges, overlays use rgba, not opaque fills
3. **Accent sparingly** — `--accent` (#4f9cf9) only on interactive / primary elements; never decorative
4. **No drop shadows** — borders carry depth instead (cheaper, cleaner on dark backgrounds)
5. **Uppercase labels** — section titles, stat labels, form field labels always uppercase + tracked
