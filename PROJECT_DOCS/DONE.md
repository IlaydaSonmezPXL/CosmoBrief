# DONE

Completed tasks, moved from TODO.md after verification.

---

<!-- Format: - [x] Task description — verified: how -->

## STORAGE ROLE (Phase 1)

- [x] Expand `.gitignore` — verified: added `.vagrant/`, `*.retry`, OS files
- [x] `ansible/requirements.yml` — verified: community.postgresql >=3.0.0
- [x] `ansible/group_vars/all.yml` — verified: app_name, backend_port
- [x] `ansible/group_vars/frontend.yml` — verified: frontend_http_port: 8080
- [x] `ansible/group_vars/backend.yml` — verified: python_version, app_dir, gunicorn_workers
- [x] `ansible/group_vars/storage.yml` — verified: postgresql_version, db_name, db_user, pg_port
- [x] `ansible/vault.yml` — verified: all 7 secret keys present as placeholders (UNENCRYPTED — must encrypt before commit)
- [x] `ansible/playbook.yml` — verified: 4 plays (storage, backend, frontend, seed); seed play uses include_role tasks_from so admin seeding lives in storage role but runs after alembic
- [x] `ansible/roles/storage/defaults/main.yml` — verified: pg_data_dir, pg_service_name, pg_bin_dir, pg_setup_bin
- [x] `ansible/roles/storage/handlers/main.yml` — verified: Restart + Reload handlers for postgresql-16
- [x] `ansible/roles/storage/templates/postgresql.conf.j2` — verified: listen_addresses=*, port, password_encryption=scram-sha-256
- [x] `ansible/roles/storage/templates/pg_hba.conf.j2` — verified: peer local, scram loopback, backend IP via hostvars (no hardcoded IPs)
- [x] `ansible/roles/storage/tasks/main.yml` — verified: AppStream disable → PGDG repo → packages (incl. python3-psycopg2) → initdb (guarded) → service → templates → flush_handlers → db + user + schema grants
- [x] `ansible/roles/storage/tasks/seed_admin.yml` — verified: ON CONFLICT DO NOTHING, graceful failed_when for missing users table
- [x] `storage/init/schema_reference.sql` — verified: all 5 tables match REQUIREMENTS.md section 8

---

## BACKEND ROLE — Ansible (Phase 2)

- [x] `ansible/roles/backend/tasks/main.yml` — verified: installs Python, creates venv, deploys app, templates env/gunicorn/systemd, runs Alembic, starts service
- [x] `ansible/roles/backend/templates/cosmobrief.env.j2` — verified: DB URL + JWT + OpenAI + SNAPI TTL vars
- [x] `ansible/roles/backend/templates/cosmobrief.service.j2` — verified: systemd unit uses venv gunicorn and .env file
- [x] `ansible/roles/backend/templates/gunicorn.conf.py.j2` — verified: bind, workers, uvicorn worker class, logs
- [x] `ansible/roles/backend/handlers/main.yml` — verified: systemd reload + service restart handlers
- [x] `ansible/roles/backend/defaults/main.yml` — verified: app_user/group, venv/service/log paths

---

## BACKEND — Application Code (Phase 2)

- [x] `backend/requirements.txt` — verified: FastAPI, async SQLAlchemy, asyncpg, Alembic, PyJWT, OpenAI SDK
- [x] `backend/alembic.ini` — verified: async URL placeholder, env overrides at runtime
- [x] `backend/alembic/env.py` — verified: async engine + asyncio.run pattern with NullPool
- [x] Alembic migrations (5 tables) — verified: users, article_cache, article_states, explanations, topic_tags
- [x] `backend/app/config.py` — verified: env-driven settings for DB/JWT/OpenAI/SNAPI TTL
- [x] `backend/app/db.py` — verified: async engine + session factory
- [x] ORM models (5 tables) — verified: user, article_cache, article_state, explanation, topic_tag
- [x] Schemas — verified: auth, article, explanation, rating, admin
- [x] Services — verified: auth_service, state_machine, snapi_client, openai_client, explanation_service
- [x] Dependencies — verified: JWT auth + admin guard
- [x] Routers — verified: health, auth, articles, explanations, ratings, users, admin
- [x] `backend/app/main.py` — verified: router registration, CORS, error handling
- [x] `backend/.env.example` — verified: local dev env template
- [x] `backend/tests/test_state_machine.py` — verified: 22 parametrized cases, all valid and invalid transitions
- [x] `backend/tests/test_explanation_service.py` — verified: 7 scenarios (new generation, cache hit, regeneration, state preservation, topic tag dedup)
- [x] `backend/tests/test_auth.py` — verified: hash/verify, JWT roundtrip, tamper detection
- [x] `mypy app/` — verified: zero errors (fixed NoReturn, passlib stubs, Literal casts, params type)
- [x] `ruff check app/` — verified: zero errors (removed 2 unused imports)
- [x] `pytest` — verified: 33/33 passed

---

## FRONTEND ROLE — Ansible (Phase 3)

- [x] `ansible/roles/frontend/defaults/main.yml` — verified: web_root, nginx_service_name
- [x] `ansible/roles/frontend/handlers/main.yml` — verified: Reload + Restart nginx handlers
- [x] `ansible/roles/frontend/templates/env.production.j2` — verified: VITE_API_URL uses ansible_host and frontend_http_port
- [x] `ansible/roles/frontend/templates/nginx.conf.j2` — verified: listen on frontend_http_port, /health endpoint, /api/ proxy to backend using hostvars (no hardcoded IPs), SPA fallback
- [x] `ansible/roles/frontend/tasks/main.yml` — verified: install nginx → template env.production (delegate_to: localhost) → npm ci → npm run build → copy dist/ → template nginx.conf → SELinux httpd_can_network_connect → firewalld → enable nginx → rsyslog client
- [x] `ansible/requirements.yml` — updated: added ansible.posix >=1.5.0 for firewalld + seboolean modules

---

## FRONTEND — Application Code (Phase 3)

- [x] `frontend/package.json` — verified: React 18, Vite, React Router v6, Axios, TypeScript, ESLint
- [x] `frontend/vite.config.ts` — verified: @vitejs/plugin-react
- [x] `frontend/tsconfig.json` — verified: strict mode, vite/client types
- [x] `frontend/index.html` — verified: root div, main.tsx entry
- [x] `frontend/src/main.tsx` — verified: ReactDOM.createRoot with StrictMode
- [x] `frontend/src/App.tsx` — verified: BrowserRouter, PrivateRoute, AdminRoute, all 6 routes
- [x] `frontend/src/context/AuthContext.tsx` — verified: JWT in localStorage, login/logout
- [x] `frontend/src/api/client.ts` — verified: Axios instance, Bearer injection, 401 → /login redirect
- [x] `frontend/src/api/auth.ts` — verified: register + login wrappers
- [x] `frontend/src/api/articles.ts` — verified: listArticles, getArticle, transitionState
- [x] `frontend/src/api/explanations.ts` — verified: requestExplanation, getExplanationHistory, rateExplanation
- [x] `frontend/src/components/Nav.tsx` — verified: home + reading map + admin (role-conditional) + logout
- [x] `frontend/src/pages/Login.tsx` — verified: form, error handling
- [x] `frontend/src/pages/Register.tsx` — verified: form, error handling
- [x] `frontend/src/pages/Feed.tsx` — verified: state + freshness filters, pagination, article cards with freshness/state badges
- [x] `frontend/src/pages/ArticleDetail.tsx` — verified: new→read side-effect, 4 mode buttons, explanation panel, thumb ratings, version history, save/dismiss buttons
- [x] `frontend/src/pages/ReadingMap.tsx` — verified: topic tag list with counts
- [x] `frontend/src/pages/AdminDashboard.tsx` — verified: all stats fields per API contract
- [x] `tsc --noEmit` — verified: zero errors
- [x] `npm run lint` — verified: zero warnings

---

## EXTRA3 — Central Logging (Phase 4)

- [x] `ansible/roles/storage/templates/rsyslog-server.conf.j2` — verified: UDP+TCP 514, per-hostname dynamic file template, routes remote logs to /var/log/cosmobrief-central/%HOSTNAME%/%PROGRAMNAME%.log
- [x] `ansible/roles/storage/tasks/main.yml` — updated: adds rsyslog install, log dir, server conf deploy, firewalld 514/udp+tcp, rsyslog enable/start
- [x] `ansible/roles/storage/handlers/main.yml` — updated: added Restart rsyslog handler
- [x] `ansible/roles/backend/templates/rsyslog-client.conf.j2` — verified: forwards *.* to storage VM via UDP 514 using hostvars (no hardcoded IPs)
- [x] `ansible/roles/backend/tasks/main.yml` — updated: adds rsyslog client conf deploy + enable/start
- [x] `ansible/roles/backend/handlers/main.yml` — updated: added Restart rsyslog handler
- [x] `ansible/roles/frontend/templates/rsyslog-client.conf.j2` — verified: forwards *.* to storage VM via UDP 514
- [x] `ansible/roles/frontend/tasks/main.yml` — updated: adds rsyslog client conf deploy + enable/start
- [x] `ansible/roles/frontend/handlers/main.yml` — updated: added Restart rsyslog handler

---

## DB Migration: saved/dismissed → read (2026-05-03)

- [x] Ran `UPDATE article_states SET state = 'read' WHERE state IN ('saved', 'dismissed')` directly on storage VM — migrated 3 rows; required because existing DB rows with old states caused Pydantic `ValidationError` against the narrowed `ArticleState` literal after the bookmark/dismiss removal

---

## Removal: Bookmark / Dismiss (2026-05-03)

- [x] `backend/app/schemas/article.py` — `ArticleState` reduced to `"new" | "read" | "explained"`; removed `ArticleStateTransitionRequest` and `ArticleStateTransitionResponse` schemas
- [x] `backend/app/services/state_machine.py` — removed `saved` and `dismissed` transitions; `VALID_TRANSITIONS` now only contains `(None, "read")` and `("read", "explained")`
- [x] `backend/app/routers/articles.py` — removed `POST /articles/{id}/state` endpoint and its imports; `StateFilter` type narrowed to match new states
- [x] `backend/app/services/explanation_service.py` — removed `{"saved", "dismissed"}` guard; state always advances to `"explained"` when a row exists
- [x] `frontend/src/api/articles.ts` — `ArticleState` type narrowed; `transitionState` function removed
- [x] `frontend/src/pages/Feed.tsx` — removed "saved" and "dismissed" from `STATE_OPTIONS` and `STATE_CLASS`; removed dismissed-filter logic
- [x] `frontend/src/pages/ArticleDetail.tsx` — removed `handleTransition`, `canSave`/`canDismiss` logic, and the action bar

---

## Feature: Reading Map expandable topics (2026-05-03)

- [x] `backend/app/schemas/article.py` — added `ReadingMapArticle` schema (article_id, title, news_site, published_at); extended `ReadingMapTopic` with `articles: List[ReadingMapArticle]`
- [x] `backend/app/routers/users.py` — replaced grouped COUNT query with JOIN on `article_cache`; groups results in Python by tag; returns full article list per topic sorted by published_at desc
- [x] `frontend/src/pages/ReadingMap.tsx` — topic rows now expand/collapse on click; expanded panel lists articles with title + source + date; clicking an article navigates to detail page

---

## Bug Fixes — Runtime (2026-05-03) continued

- [x] `backend/app/services/explanation_service.py` — removed `async with session.begin()` wrapper; router already autobegins a transaction via `db.get()` before calling the service, so `session.begin()` raised `InvalidRequestError: A transaction is already begun on this Session` — fixed by removing the context manager and adding explicit `await session.commit()` before return — verified: explanations generate successfully

---

## Bug Fixes — Runtime (2026-05-03)

- [x] `backend/app/services/snapi_client.py` — `SNAPI_MAX_PAGES = 5` cap added; fetch loop was hammering all ~340 pages and triggering SNAPI 429 rate-limit — verified: `GET /articles` returns articles
- [x] `backend/app/services/snapi_client.py` — 429 now breaks with partial results instead of raising `SnapiUnavailable`; any articles fetched before rate-limit are cached — verified: no 503 on partial SNAPI responses
- [x] `backend/app/services/snapi_client.py` — `parse_published_at` now forces `tzinfo=UTC` when `fromisoformat` returns a naive datetime; asyncpg rejected naive datetimes for TIMESTAMPTZ columns — verified: no `DataError` on insert
- [x] `backend/app/models/article_cache.py` — `published_at` and `cached_at` mapped with `DateTime(timezone=True)`; previously lacked explicit type so SQLAlchemy generated `TIMESTAMP WITHOUT TIME ZONE` casts incompatible with the migration schema — verified: INSERT succeeds
- [x] `backend/app/models/article_state.py` — `updated_at` mapped with `DateTime(timezone=True)` — same root cause as above
- [x] `backend/app/models/explanation.py` — `generated_at` mapped with `DateTime(timezone=True)` — same root cause as above

---

## Bug Fixes (Review Pass — Phase 3)

- [x] SNAPI v4 field names: `newsSite`→`news_site`, `imageUrl`→`image_url`, `publishedAt`→`published_at` in `snapi_client.py` — CRITICAL: camelCase returned None for all three fields
- [x] SELinux `httpd_can_network_connect=yes` added to frontend role — CRITICAL: without this nginx returns 502 on all proxied API calls on AlmaLinux 9
- [x] Feed dismissed filter: dismissed articles now hidden from default feed (FR-FE-03) via client-side filter in `Feed.tsx`
- [x] EXTRA1/EXTRA2 acceptance conditions verified and documented in PHASE3.md
- [x] `PROJECT_PHASES/PHASE2.md` created
- [x] `PROJECT_PHASES/PHASE3.md` created

---

## EXTRA4 — AWS Academy Deployment (Phase 4)

- [x] `PROJECT_DOCS/PROJECT_STRUCTURE.md` — corrected AWS provisioning working directory (repo root), added `-e "frontend_http_port=80"` to deploy command, added connectivity check step, fixed teardown command, updated configuration table
- [x] `PROJECT_DOCS/PROJECT_README.md` — added full AWS Deployment section with all steps, updated EXTRA4 extras table entry
- [x] `PROJECT_PHASES/PHASE4.md` — created: documents AWS architecture, port override pattern, role compatibility, canonical deploy commands
- [x] No new Ansible code required — roles already use `hostvars` for all IPs, no hardcoded addresses anywhere

---

## Additional Features — UI Overhaul + Wordle (2026-05-04)

- [x] Space Wordle game: migration `f6a1b2c3d4e5` (`wordle_words` table), 94 space words seeded via `seed_wordle.yml`, `GET /wordle/words` endpoint, `Wordle.tsx` page with full game logic, localStorage daily persistence, `/wordle` route, nav link
- [x] Feed badge cleanup: `new` and `explained` badges removed from article cards; both `read`/`explained` states render single `read` badge
- [x] Feed filter: removed "Explained" option; "New" renamed "Unread"
- [x] Back button: `btn-back` class — always-visible border, cyan glow on hover, no arrow character
- [x] Earth SVG icon: extracted to `EarthIcon.tsx`; used in Nav, Login, Register (replaces conic-gradient circle)
- [x] Favicon: 🌍 emoji, viewBox `0 0 32 32` with correct x/y offsets to avoid clipping
- [x] Fonts: Space Grotesk (body) + Orbitron (display/headings) loaded in `index.html`; CSS vars `--font-body` / `--font-display`
- [x] Animations: CSS star field (24 radial-gradient dots + twinkling), nebula ambient glow, card stagger fadeSlideUp, Wordle tile flip/shake/pop
- [x] Active nav link highlight (`.nav-link.active` → cyan)
- [x] `mypy app/` — zero errors; `npx tsc --noEmit` — zero errors; `npm run lint` — zero warnings

## Additional Features — Cleanup (2026-05-04)

- [x] Removed "Mark as Unread" feature (`DELETE /articles/{id}/state` endpoint removed, `unreadArticle` removed from `api/articles.ts`, state removed from `ArticleDetail.tsx`)
- [x] Wordle tile size increased: 58px → 68px; key height 54px → 58px; min-width 38px → 44px; gaps enlarged; container widened to 600px
- [x] Wordle backspace fix: `e.preventDefault()` on Backspace/Enter/Tab/letter keys in `onKeyDown` handler — prevents browser tab-switch on backspace
- [x] `mypy app/` — zero errors; `npx tsc --noEmit` — zero errors; `npm run lint` — zero warnings

## Feature: Reading Map Constellation (2026-05-04)

- [x] `ReadingMap.tsx` rewritten as interactive SVG constellation — no new dependencies, pure React + SVG
- [x] 90 decorative background micro-stars via mulberry32 PRNG — fully independent x/y (old single-hash approach correlated them), size 0.3–1.4px, per-star `--op-lo`/`--op-hi`/`--dur`/`--del` CSS custom props drive individual twinkle speed and opacity range
- [x] `@keyframes bgStarLive` in `index.css`: single animation handles staggered fade-in (opacity 0 at 0%) then irregular twinkle (two peaks per cycle, not just alternate) — each star has 3.5–11s duration and 0–6s delay so no two blink in sync
- [x] Topic stars: staggered `fadeIn` per `<g>` element (70ms between stars) — constellation builds in left-to-right rather than all popping at once
- [x] Topic stars: position from deterministic tag hash (two independent seeds for x/y), radius proportional to article count, glow via `feGaussianBlur` SVG filter
- [x] Constellation lines between 2 nearest neighbors per star (threshold 320px), dashed when inactive, solid when selected star active
- [x] Click star: pulsing ring animation, article panel slides in below SVG; deselect by clicking again
- [x] Empty state: background stars + centered text prompt — never looks blank
- [x] CSS: `.bg-star`, `.star-idle`, `.star-selected`, `.star-ring`, `.constellation-*` classes in `index.css`
- [x] Reading Map full-width layout: SVG breaks out of container (`SVG_W` 860→1280, `SVG_H` 400→440), only header + article panel stay in `.container`; SVG has `1.5rem` side padding only
- [x] `ScrollToTop` component (`src/components/ScrollToTop.tsx`): scrolls `window` to `(0,0)` on every `pathname` change; mounted inside `<BrowserRouter>` in `App.tsx` above `<Routes>` — every page transition starts at top
- [x] `npx tsc --noEmit` — zero errors; `npm run lint` — zero warnings

---

## Feature: Article Search (2026-05-04)

- [x] `backend/app/routers/articles.py` — `apply_filters` extended with `q` param; `ILIKE %q%` filter on `title OR summary` applied to both data and count queries; `list_articles` endpoint exposes `q: Optional[str] = Query(None, max_length=200)`
- [x] `frontend/src/api/articles.ts` — `q?: string` added to `listArticles` params
- [x] `frontend/src/pages/Feed.tsx` — `searchInput` (controlled) + `searchQuery` (debounced 350 ms) states; search resets to page 1 on change; `q` forwarded to `listArticles`; `<input type="search">` rendered first in filter bar
- [x] `frontend/src/index.css` — `.filter-search` (flex: 1, min-width: 180px) + `.filter-search-input` styled to match theme (bg-elevated, border-mid, accent focus ring)
- [x] `npx tsc --noEmit` — zero errors

---

## Bug Fix: Feed pagination scroll (2026-05-04)

- [x] `frontend/src/pages/Feed.tsx` — added `useLayoutEffect` on `[articles]` dep with `isInitialMount` ref guard; scrolls `window` to top after React commits new article list to DOM — fires after content renders, not before. Root cause: `ScrollToTop` only watches `pathname`; pagination changes `offset` state only, pathname stays `/`, so `ScrollToTop` never fired on Next/Prev clicks.
- [x] `npx tsc --noEmit` — zero errors

---

## Polish: Reading Map star animations (2026-05-04)

- [x] `ReadingMap.tsx` — replaced `BG_STARS` generator: mulberry32 PRNG produces fully independent x/y (old Knuth hash derived x and y from same value → visible clustering); 90 stars (was 60); size 0.3–1.4px; per-star `opLo`, `opHi`, `dur`, `del` fields
- [x] `ReadingMap.tsx` — bg-star `<circle>` now passes `--op-lo`, `--op-hi`, `--dur`, `--del` as CSS custom properties via inline style; removed `opacity` attribute (CSS animation controls it fully)
- [x] `ReadingMap.tsx` — topic star `<g>` elements get staggered `fadeIn 0.5s ease-out ${idx * 0.07}s both` — constellation builds in sequentially instead of all appearing at once
- [x] `index.css` — `.bg-star` now uses `bgStarLive var(--dur) ease-in-out var(--del) infinite both`; each star twinkles at its own rate with its own opacity range — no synchronised blinking
- [x] `index.css` — `@keyframes bgStarLive`: 0% opacity 0 (invisible before delay, free staggered fade-in), then irregular two-peak twinkle cycle using `var(--op-hi)` / `var(--op-lo)`
- [x] `npx tsc --noEmit` — zero errors

---

## Feature: Reading Map infinite pan (2026-05-04)

- [x] `ReadingMap.tsx` — `pan {x, y}` state + `isDragging` state; `dragStart` ref (mousedown coords + pan snapshot) + `hasDragged` ref (true when mouse moves >3px during drag)
- [x] SVG `onMouseDown`/`onMouseMove`/`onMouseUp`/`onMouseLeave` handlers — `mousemove` computes delta from snapshot, sets pan; `mouseup`/`mouseLeave` ends drag
- [x] Constellation lines + topic stars wrapped in `<g transform="translate(pan.x, pan.y)">` — everything pans as one unit
- [x] Background (rect + bg-stars) stays outside pan group — parallax effect, distant stars fixed while constellation moves
- [x] BG_STARS converted from percentage coords to absolute SVG px coords — required since bg-stars are no longer in the same coordinate space as panned content
- [x] SVG `overflow: hidden` (was `visible`) — panned content clips cleanly at edges
- [x] SVG cursor: `grab` idle, `grabbing` while dragging; `userSelect: none` prevents text highlight during drag
- [x] `hasDragged` guard in `handleStarClick` — prevents star toggle firing after a drag release
- [x] `e.detail > 1` guard on star `onClick` — double-clicking a star resets pan instead of toggling selection
- [x] SVG `onDoubleClick` → `setPan({ x: 0, y: 0 })` — returns constellation to origin
- [x] Subtitle updates to "drag to explore · double-click to reset" when topics exist
- [x] `npx tsc --noEmit` — zero errors

---

## Feature: Reading Map compact/expand toggle (2026-05-04)

- [x] `ReadingMap.tsx` — `expanded` state (default `false`); `constellation-wrap` gets `maxWidth: expanded ? "100%" : "72%"` + `margin: "0 auto"` + matching transition — compact is narrower AND shorter
- [x] Inner wrapper div uses `paddingBottom: expanded ? "34.375%" : "26%"` for responsive height (padding-bottom % is relative to width, so height stays proportional at all viewport sizes)
- [x] SVG moved to `position: absolute; inset: 0; width/height: 100%` to fill wrapper; `preserveAspectRatio="xMidYMid slice"` fills width, clips bottom in compact
- [x] "Expand"/"Collapse" `btn-ghost` button overlaid top-right of map (`position: absolute; z-index: 2`)
- [x] "Reset" `btn-ghost` button overlaid bottom-right — replaces double-click-to-reset; `onClick` sets `pan` to `{x:0, y:0}`
- [x] Double-click handler removed from SVG; `e.detail > 1` guard removed from star `onClick`
- [x] Subtitle trimmed to "drag to explore" (double-click hint removed)
- [x] Both width and height transition with `cubic-bezier(0.4,0,0.2,1)` at 0.4s

## Bug Fix: Reading Map border missing in compact mode (2026-05-04)

- [x] Root cause: border was the SVG's internal `<rect stroke="#1a2540">` — clipped by wrapper `overflow: hidden` in compact mode
- [x] Fix: moved border to wrapper div (`border: 1px solid #1a2540`) — always visible regardless of SVG clip; removed redundant internal SVG stroke rect

## Bug Fix: Wordle state shared across users (2026-05-04)

- [x] Root cause: localStorage key was `wordle_${date}` — same for all users on same browser (different accounts saw each other's solved state)
- [x] Fix: key changed to `wordle_${userId}_${date}`; `loadGameState` and `saveGameState` now accept `userId: string`; `useAuth` added to Wordle component; `user!.userId` passed at all call sites
- [x] `npx tsc --noEmit` — zero errors

## Bug Fix: Register shows wrong error for invalid password (2026-05-04)

- [x] Root cause: `RegisterRequest.password` has `min_length=6`; "test" (4 chars) → backend 422 validation error; frontend `catch` block was hardcoded to show "Username or email may already exist" for ALL errors
- [x] Fix: `Register.tsx` imports `axios`; `catch (err)` checks `axios.isAxiosError` + `err.response.status`; 409 → "Username or email already taken"; 422 → field-specific message (checks if `message` string contains "password"/"username"/"email"); other → generic fallback
- [x] `npx tsc --noEmit` — zero errors

---

## UX Fix: Thumbs-down regenerate without refresh (2026-05-04)

- [x] Root cause: after 👎, backend sets `needs_regeneration=true` but frontend only updated `explanation.rating` locally — no way to regenerate without re-clicking the mode button or refreshing; mode bar badge `↻` also stayed stale
- [x] `ArticleDetail.tsx` `handleRate`: on successful 👎, also calls `setArticle` to update `article.explanations[activeMode].needs_regeneration = true` locally — mode bar badge flips to `↻` immediately
- [x] "Regenerate" `btn-ghost` button rendered inline next to "Rated 👎" when `explanation.rating === "down"` — calls `handleExplain(activeMode!)` directly
- [x] `npx tsc --noEmit` — zero errors

---

## Feature: User menu + Settings + Account (2026-05-04)

- [x] `backend/app/schemas/auth.py` — added `username: str` to `TokenResponse`; both `/auth/register` and `/auth/login` now return username
- [x] `backend/app/schemas/users.py` (new) — `UserMeResponse` (user_id, username, email, role, created_at), `UpdateMeRequest` (current_password + optional new_username/new_email/new_password)
- [x] `backend/app/routers/users.py` — added `GET /users/me`, `PATCH /users/me` (requires current password, checks uniqueness), `DELETE /users/me/data` (wipes article_states + topic_tags + explanations for user)
- [x] `frontend/src/context/AuthContext.tsx` — `AuthUser` extended with `username: string | null`; `login()` takes username param; `updateUsername()` added to context; all persisted to localStorage
- [x] `frontend/src/api/auth.ts` — `TokenResponse` interface updated with `username`
- [x] `frontend/src/api/users.ts` (new) — `getMe`, `updateMe`, `wipeUserData` typed API wrappers
- [x] `frontend/src/main.tsx` — theme init: reads `cosmo_theme` from localStorage and sets `data-theme` on `<html>` before first render (no flash)
- [x] `frontend/src/components/UserMenu.tsx` (new) — dropdown with 3 sub-views: Menu (name + settings/account/signout), Settings (4 accent theme swatches + wipe with inline confirm), Account (email/member-since display + update form)
- [x] `frontend/src/components/Nav.tsx` — replaced `nav-logout` button with `<UserMenu />`
- [x] `frontend/src/pages/Login.tsx` + `Register.tsx` — `authLogin()` calls updated to pass `data.username`
- [x] `frontend/src/index.css` — `--accent-rgb` + `--accent-light` tokens; `[data-theme]` variants for nebula/aurora/solar (accent only at this stage); all hardcoded `rgba(79,156,249,X)` replaced with `rgba(var(--accent-rgb),X)`; `.user-menu-*`, `.user-panel-*`, `.theme-swatch`, `.btn-sm`, `.btn-danger`, `.btn-primary-sm` classes added
- [x] `frontend/src/pages/Wordle.tsx` — fixed pre-existing `react-hooks/exhaustive-deps` warnings (added `user` to deps of both `useEffect` and `useCallback`)
- [x] `mypy app/` — zero errors; `npx tsc --noEmit` — zero errors; `npm run lint` — zero warnings

---

## Feature: Astronomical Events widget + Google Calendar (2026-05-05)

- [x] `backend/app/schemas/astronomical.py` — `AstronomicalEvent`, `AstronomicalEventsResponse` schemas
- [x] `backend/app/routers/astronomical.py` — `GET /astronomical/events?lat&lon`; curated annual event list (9 meteor showers, 4 solstices/equinoxes, 2 fixed 2026 eclipses); AstronomyAPI `/bodies/positions` proxy (Basic auth, filters planets with altitude ≥ 10°); azimuth→compass conversion; planets returned first (tonight), curated events sorted by date after
- [x] `backend/app/config.py` — `astronomy_app_id` + `astronomy_app_secret` settings (default empty string so server starts without them)
- [x] `backend/app/main.py` — registered `astronomical.router`
- [x] `ansible/roles/backend/templates/cosmobrief.env.j2` — `ASTRONOMY_APP_ID` + `ASTRONOMY_APP_SECRET` vars added
- [x] `frontend/src/api/astronomical.ts` — `getAstronomicalEvents(lat?, lon?)` typed wrapper
- [x] `frontend/src/components/AstronomicalEvents.tsx` — browser geolocation auto-detect → Nominatim city geocoding fallback → localStorage persistence; horizontal scroll card strip; event cards with type icon, name, date, time hint, compass direction + altitude, description, "+ Calendar" link; Google Calendar URL scheme per event
- [x] `frontend/src/pages/Feed.tsx` — `<AstronomicalEvents />` rendered between filter bar and article list
- [x] `frontend/src/index.css` — `.astro-*` classes: section, location bar, location form, strip (horizontal scroll), card (200px fixed-width, type-specific left border accent), card header/name/date/time/direction/desc/cal button
- [x] `mypy app/` — zero errors; `npx tsc --noEmit` — zero errors; `npm run lint` — zero warnings
- **Pending user action:** `ansible-vault edit ansible/vault.yml` → add `vault_astronomy_app_id` and `vault_astronomy_app_secret`

---

## Enhancement: Full-site theme system (2026-05-04)

- [x] `frontend/src/index.css` — `--bg-rgb` token added to `:root`; each `[data-theme]` block now overrides `--bg`, `--bg-rgb`, `--bg-card`, `--bg-card-hover`, `--bg-elevated`, `--border`, `--border-mid` in addition to accent tokens — entire site background/card/border palette shifts per theme
- [x] `frontend/src/index.css` — `[data-theme] body::before` overrides added: Nebula = all purple glow, Aurora = all cyan glow, Solar = all amber glow
- [x] `frontend/src/index.css` — nav background changed from hardcoded `rgba(7,9,15,0.92)` to `rgba(var(--bg-rgb),0.92)` — frosted glass tint follows active theme
- [x] `DESIGN/THEME.md` — color token table updated with theme-swappable/fixed distinction; Themes section expanded with full per-theme breakdown; Nav and Background sections updated
- [x] `DESIGN/ROADMAP.md` — User Menu theme system description updated to reflect full-site scope
- [x] `npx tsc --noEmit` — zero errors; `npm run lint` — zero warnings

---

## Feature: Wordle Scoreboard (2026-05-05)

- [x] `frontend/src/pages/Wordle.tsx` — `StatsData` interface + `EMPTY_STATS`; `loadStats`/`saveStats`/`updateStats`/`getDisplayStreak`/`getYesterday` helpers; `stats`/`showStats`/`copied` state; stats loaded on mount alongside game state; `handleKey` completion paths call `updateStats` + `saveStats` + `setTimeout(() => setShowStats(true), 1500)`; `handleShare` copies emoji grid to clipboard; stats modal JSX (overlay + panel + 4-box grid + distribution bars + share footer); "Stats" `btn-ghost` button in `.wordle-controls`; `stats` added to `handleKey` useCallback deps
- [x] `frontend/src/index.css` — `.wordle-stats-overlay`, `.wordle-stats-panel`, `.wordle-stats-header`, `.wordle-stats-title`, `.wordle-stats-close`, `.wordle-stats-grid`, `.wordle-stats-box`, `.wordle-stats-value`, `.wordle-stats-label`, `.wordle-stats-dist-title`, `.wordle-stats-dist`, `.wordle-stats-bar-row`, `.wordle-stats-bar-num`, `.wordle-stats-bar-track`, `.wordle-stats-bar-fill [.current]`, `.wordle-stats-bar-count`, `.wordle-stats-footer` classes added
- [x] `DESIGN/ROADMAP.md` — Wordle Scoreboard section added (streak rules, storage, share format, design decisions)
- [x] `DESIGN/COMPONENTS.md` — Wordle Stats Modal section added
- [x] `npx tsc --noEmit` — zero errors; `npm run lint` — zero warnings

---

## Bug Fixes: Wordle Share + Favicon (2026-05-05)

- [x] `frontend/src/pages/Wordle.tsx` — `handleShare` rewritten with `async/try/catch` + `execCommand("copy")` fallback; old `void .writeText().catch(() => undefined)` pattern failed silently because `navigator.clipboard` undefined in HTTP contexts throws a synchronous TypeError (not a promise rejection), so `.catch()` never fired
- [x] `frontend/index.html` — favicon changed from `viewBox='0 0 32 32'` with `font-size='28'` to `viewBox='0 0 100 100'` with `font-size='90'` and `y='.9em'` (Lea Verou pattern); old small viewBox clipped the emoji top because emoji ascent reached the boundary at pixel 0

---

## Polish: Wordle stat labels (2026-05-05)

- [x] `frontend/src/pages/Wordle.tsx` — stat box labels changed to: "Played", "Win %", "Current Streak", "Max Streak" (matches NYT Wordle naming)
- [x] `frontend/src/index.css` — `.wordle-stats-label` removed `text-transform: uppercase`; added `line-height: 1.4` + `word-break: break-word` so "Current Streak" / "Max Streak" wrap cleanly in narrow columns
