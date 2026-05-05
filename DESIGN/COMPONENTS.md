# UI Components

All styling is class-based via `frontend/src/index.css`. Inline `style={{}}` is used only for unavoidable dynamic values (e.g. computed colors from data).

---

## Layout

```tsx
// Full page wrapper (accounts for sticky nav)
<div className="page">
  <Nav />
  <div className="container">      {/* max 860px */}
  <div className="container-sm">   {/* max 440px — auth, reading map */}
```

---

## Nav

```tsx
<nav className="nav">
  <Link className="nav-brand">
    <EarthIcon size={20} />
    Cosmo Brief
  </Link>
  <Link className="nav-link">…</Link>
  <span className="nav-spacer" />   {/* pushes UserMenu right */}
  <UserMenu />                      {/* replaces old nav-logout button */}
</nav>
```

## UserMenu

Dropdown triggered by `[● username ▾]` button in the nav.

```tsx
<div className="user-menu-wrap">
  <button className="user-menu-trigger [active]">
    <span className="user-avatar">A</span>      {/* first initial, accent bg */}
    <span className="user-menu-name">username</span>
    <span className="user-menu-caret">▾</span>
  </button>

  <div className="user-menu-dropdown">
    {/* view === "menu" */}
    <div className="user-menu-head">…</div>
    <div className="user-menu-body">
      <button className="user-menu-item">⚙ Settings</button>
      <button className="user-menu-item">◎ Account</button>
    </div>
    <div className="user-menu-footer">
      <button className="user-menu-item signout">→ Sign out</button>
    </div>

    {/* view === "settings" | "account" */}
    <div className="user-panel-header">
      <button className="user-panel-back">←</button>
      <span className="user-panel-title">Settings</span>
    </div>
    <div className="user-panel-body">
      {/* theme swatches, wipe button, or account form */}
    </div>
  </div>
</div>
```

Theme swatches: `.theme-swatch [.active]` — 26px colored circles; `.theme-label` for current name.  
Panel inputs: `.user-panel-input` — styled like auth inputs but compact.  
Panel buttons: `.btn.btn-sm` + `.btn-danger` (wipe) or `.btn-primary-sm` (save).  
Success message: `.user-panel-success` (cyan text).  
Meta rows: `.user-panel-meta-row` with `.user-panel-meta-key` + `.user-panel-meta-val`.

---

## Page Header

```tsx
<div className="page-header">
  <h1 className="page-title">…</h1>
  <p className="page-subtitle">…</p>
</div>
```

---

## Buttons

| Class | Use |
|---|---|
| `.btn` | Default ghost button |
| `.btn.btn-primary` | Full-width primary CTA (auth submit) |
| `.btn.btn-active` | Active/selected state (explanation mode) |
| `.btn.btn-ghost` | Low-emphasis action (back, history toggle) |

Disabled state: add `disabled` prop — CSS handles opacity + cursor.

---

## Badges

```tsx
<span className="badge badge-fresh">fresh</span>
<span className="badge badge-aging">aging</span>
<span className="badge badge-archived">archived</span>

<span className="badge badge-new">new</span>
<span className="badge badge-read">read</span>
<span className="badge badge-explained">explained</span>
```

---

## Article Card (Feed)

```tsx
<div className="article-card" onClick={…}>
  <div className="article-badges">
    <span className="badge badge-{freshness}">{freshness}</span>
    <span className="badge badge-{state}">{state}</span>
  </div>
  {image && <img className="article-img" />}
  <div className="article-title">…</div>
  <div className="article-meta">site · date</div>
  <p className="article-summary">…</p>
</div>
```

---

## Filter Bar

```tsx
<div className="filter-bar">
  {/* Search input — flex-grows to fill available width, debounced 350 ms */}
  <div className="filter-search">
    <input
      type="search"
      className="filter-search-input"
      placeholder="Search articles…"
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
    />
  </div>
  <div className="filter-group">
    <span>Label</span>
    <select>…</select>
  </div>
</div>
```

Search fires server-side (`GET /articles?q=…`); ILIKE on `title` and `summary`. Resets to page 1 on each query change.

---

## Forms (Auth)

```tsx
<div className="auth-page">
  <div className="auth-card">
    <div className="auth-logo">
      <span className="auth-logo-icon" />
      <span className="auth-logo-text">Cosmo Brief</span>
    </div>
    <h1 className="auth-title">…</h1>
    <p className="auth-subtitle">…</p>
    <div className="form-group">
      <label>Field</label>
      <input … />
    </div>
    {error && <p className="error-text">{error}</p>}
    <button className="btn btn-primary">Submit</button>
  </div>
</div>
```

---

## Explanation Panel

```tsx
<div className="explanation-panel">
  <div className="explanation-meta">v{n} · date · source</div>
  <p className="explanation-text">…</p>
  <div className="explanation-actions">
    <button className="btn">👍</button>
    <button className="btn">👎</button>
    <button className="btn btn-ghost" style={{ marginLeft: "auto" }}>History</button>
  </div>
</div>
```

---

## Admin Stat Grid

```tsx
<div className="stat-grid">
  <div className="stat-card">
    <div className="stat-value">{n}</div>
    <div className="stat-label">Label</div>
  </div>
</div>
```

---

## Admin Section

```tsx
<div className="admin-section">
  <p className="admin-section-title">Section Title</p>
  <div className="mode-row">
    <span className="mode-name">name</span>
    <span className="mode-count">{n}</span>
  </div>
</div>
```

---

## Reading Map — Expandable Topics

```tsx
// Topic row — click toggles expanded state
<div className="topic-tag-row" onClick={() => toggleTag(tag)} style={{ cursor: "pointer" }}>
  <span className="topic-tag-name">{tag}</span>
  <span className="topic-tag-count">
    {article_count} articles
    <span>{expanded === tag ? "▲" : "▼"}</span>
  </span>
</div>

// Expanded article list — sits directly below the row, no top border
{expanded === tag && (
  <div style={{
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderTop: "none",
    borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
  }}>
    {articles.map((a) => (
      <div key={a.article_id} onClick={() => navigate(`/articles/${a.article_id}`)}>
        <div style={{ fontSize: "0.875rem", color: "var(--text)" }}>{a.title}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {a.news_site} · {date}
        </div>
      </div>
    ))}
  </div>
)}
```

---

## Astronomical Events Widget

Rendered in `Feed.tsx` between the filter bar and article list. Self-contained component.

```tsx
<div className="astro-section">
  {/* Location bar */}
  <div className="astro-location-bar">
    <span className="astro-location-label">
      <span className="astro-location-pin">◎</span>
      Brussels, Belgium
    </span>
    <button className="btn btn-ghost astro-location-btn">Change</button>
  </div>

  {/* City input — shown when editMode === true */}
  <form className="astro-location-form">
    <input className="filter-search-input astro-city-input" type="text" placeholder="Enter city name…" />
    <button className="btn btn-primary-sm" type="submit">Set</button>
    {geoError && <span className="astro-geo-error">{geoError}</span>}
  </form>

  {/* Horizontal scroll strip */}
  <div className="astro-strip">
    <div className="astro-card astro-card--{type}">
      <div className="astro-card-header">
        <span className="astro-card-icon">☄</span>
        <span className="astro-card-type">Meteor Shower</span>
      </div>
      <div className="astro-card-name">Perseid Meteor Shower</div>
      <div className="astro-card-date">Aug 12, 2026</div>
      <div className="astro-card-time">after midnight</div>
      <div className="astro-card-direction">Look: <strong>NE</strong> · 42°</div>
      <p className="astro-card-desc">Up to 100 meteors/hr…</p>
      <a className="astro-card-cal" href="https://calendar.google.com/…" target="_blank">+ Calendar</a>
    </div>
  </div>
</div>
```

Card type → left border accent:

| `.astro-card--{type}` | Border color |
|---|---|
| `meteor_shower` | `--accent-cyan` |
| `planet` | `--accent` |
| `eclipse` | `--accent-gold` |
| `solstice` | `--accent-purple` |
| `moon` | `--text-sec` |

---

## Wordle Stats Modal

Triggered by "Stats" `btn-ghost` button below keyboard. Auto-opens 1.5 s after game end.

```tsx
{showStats && (
  <div className="wordle-stats-overlay" onClick={() => setShowStats(false)}>
    <div className="wordle-stats-panel" onClick={(e) => e.stopPropagation()}>
      <div className="wordle-stats-header">
        <span className="wordle-stats-title">YOUR STATS</span>
        <button className="wordle-stats-close">✕</button>
      </div>

      {/* 4-column stat grid */}
      <div className="wordle-stats-grid">
        <div className="wordle-stats-box">
          <div className="wordle-stats-value">{n}</div>
          <div className="wordle-stats-label">PLAYED</div>
        </div>
        {/* WIN % · STREAK · BEST */}
      </div>

      {/* Guess distribution */}
      <div className="wordle-stats-dist-title">GUESS DISTRIBUTION</div>
      <div className="wordle-stats-dist">
        <div className="wordle-stats-bar-row">
          <span className="wordle-stats-bar-num">3</span>
          <div className="wordle-stats-bar-track">
            <div className="wordle-stats-bar-fill [current]" style={{ width: "75%" }}>
              <span className="wordle-stats-bar-count">12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share — only shown when gameOver */}
      <div className="wordle-stats-footer">
        <button className="btn btn-ghost">Share 🔗</button>
      </div>
    </div>
  </div>
)}
```

Bar width scales to max bar count (min 7% so zero-bars stay visible). `.current` class = today's guess count, highlighted with `--accent-cyan`. Overlay click-outside dismisses.

---

## Divider

```tsx
<hr className="divider" />
```

---

## States / Feedback

```tsx
{loading && <p className="loading-text">Loading…</p>}
{error   && <p className="error-text">{error}</p>}
```

---

## Pagination

```tsx
<div className="pagination">
  <button className="btn" disabled={…} onClick={prev}>← Prev</button>
  <span className="pagination-info">{page} / {total}</span>
  <button className="btn" disabled={…} onClick={next}>Next →</button>
</div>
```
