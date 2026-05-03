# Design Theme

Space/astronomy dark theme. All tokens live in `frontend/src/index.css` as CSS custom properties.

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#07090f` | Page background |
| `--bg-card` | `#0c1120` | Card surfaces |
| `--bg-card-hover` | `#101828` | Card hover state |
| `--bg-elevated` | `#131d2e` | Elevated panels (explanation, history) |
| `--border` | `#1a2540` | Default borders |
| `--border-mid` | `#243354` | Medium-emphasis borders, input focus rings |
| `--accent` | `#4f9cf9` | Primary CTA, links, active states |
| `--accent-purple` | `#8b5cf6` | Secondary accent, "read" state badge |
| `--accent-cyan` | `#22d3ee` | "fresh" badge, "explained" state badge |
| `--accent-gold` | `#f59e0b` | "aging" badge |
| `--text` | `#dde3f0` | Primary text |
| `--text-sec` | `#7e8fa8` | Secondary / body text |
| `--text-muted` | `#3f4e66` | De-emphasized labels, metadata |
| `--fresh` | `#22d3ee` | Freshness: fresh (< 48 h) |
| `--aging` | `#f59e0b` | Freshness: aging (48–96 h) |
| `--archived` | `#5a6478` | Freshness: archived (> 96 h) |

---

## Typography

**Font:** Inter (Google Fonts), fallback `system-ui, -apple-system, sans-serif`.

| Use | Size | Weight |
|---|---|---|
| Page title | `1.4rem` | 700 |
| Detail title | `1.45rem` | 700 |
| Auth title | `1.35rem` | 700 |
| Body | `0.9rem` | 400 |
| Article title | `0.95rem` | 600 |
| Labels / badges | `0.72–0.75rem` | 600–700, uppercase |
| Meta / muted | `0.78–0.82rem` | 400 |

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

Sticky, `position: sticky; top: 0`. Background `rgba(7,9,15, 0.9)` with `backdrop-filter: blur(16px)` for frosted glass effect. Brand mark is a `22×22px` conic-gradient circle (accent→purple→cyan loop).

---

## Background

Flat dark `--bg`. No animated star fields or canvas effects — keeps the app fast and accessible. The dark blue-tinted palette carries the space aesthetic without visual noise.

---

## Design Principles

1. **Dark first** — every new component starts from `--bg-card`, not white
2. **Translucent over solid** — badges, overlays use rgba, not opaque fills
3. **Accent sparingly** — `--accent` (#4f9cf9) only on interactive / primary elements; never decorative
4. **No drop shadows** — borders carry depth instead (cheaper, cleaner on dark backgrounds)
5. **Uppercase labels** — section titles, stat labels, form field labels always uppercase + tracked
