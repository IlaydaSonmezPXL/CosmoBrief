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
    <span className="nav-brand-icon" />   {/* conic-gradient circle */}
    Cosmo Brief
  </Link>
  <Link className="nav-link">…</Link>
  <span className="nav-spacer" />         {/* pushes logout right */}
  <button className="nav-logout">…</button>
</nav>
```

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
  <div className="filter-group">
    <span>Label</span>
    <select>…</select>
  </div>
</div>
```

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
