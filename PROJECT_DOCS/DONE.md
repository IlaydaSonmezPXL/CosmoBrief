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
