# TODO

Implementation order: storage → backend → frontend → extras

---

## STORAGE ROLE

- [x] Expand `.gitignore` with all missing entries
- [x] Create `ansible/group_vars/all.yml`
- [x] Create `ansible/group_vars/frontend.yml`
- [x] Create `ansible/group_vars/backend.yml`
- [x] Create `ansible/group_vars/storage.yml`
- [x] Create `ansible/vault.yml` (unencrypted placeholder — user must encrypt before committing)
- [x] Create `ansible/requirements.yml` (community.postgresql collection)
- [x] Create `ansible/playbook.yml` entry point (4 plays: storage, backend, frontend, seed)
- [x] Create `ansible/roles/storage/tasks/main.yml` — disable AppStream, install PG16 (PGDG), initdb (guarded), configure pg_hba.conf + postgresql.conf, create DB + user + grants
- [x] Create `ansible/roles/storage/tasks/seed_admin.yml` — admin seed (ON CONFLICT DO NOTHING, graceful if users table absent)
- [x] Create `ansible/roles/storage/templates/pg_hba.conf.j2`
- [x] Create `ansible/roles/storage/templates/postgresql.conf.j2`
- [x] Create `ansible/roles/storage/handlers/main.yml`
- [x] Create `ansible/roles/storage/defaults/main.yml`
- [x] Create `storage/init/schema_reference.sql` (documentation only)

---

## BACKEND ROLE — Ansible

- [x] Create `ansible/roles/backend/tasks/main.yml` — create system user, install python3.11, create venv, pip install, deploy app code, template .env, run alembic upgrade head, deploy systemd service
- [x] Create `ansible/roles/backend/templates/cosmobrief.env.j2`
- [x] Create `ansible/roles/backend/templates/cosmobrief.service.j2`
- [x] Create `ansible/roles/backend/templates/gunicorn.conf.py.j2`
- [x] Create `ansible/roles/backend/handlers/main.yml`
- [x] Create `ansible/roles/backend/defaults/main.yml`

---

## BACKEND — Application Code

- [x] Create `backend/requirements.txt`
- [x] Create `backend/alembic.ini`
- [x] Create `backend/alembic/env.py`
- [x] Create Alembic migration: `users` table
- [x] Create Alembic migration: `article_cache` table
- [x] Create Alembic migration: `article_states` table
- [x] Create Alembic migration: `explanations` table
- [x] Create Alembic migration: `topic_tags` table
- [x] Create `backend/app/config.py` (pydantic-settings, all env vars)
- [x] Create `backend/app/db.py` (async SQLAlchemy engine + session)
- [x] Create `backend/app/models/user.py`
- [x] Create `backend/app/models/article_cache.py`
- [x] Create `backend/app/models/article_state.py`
- [x] Create `backend/app/models/explanation.py`
- [x] Create `backend/app/models/topic_tag.py`
- [x] Create `backend/app/schemas/auth.py`
- [x] Create `backend/app/schemas/article.py`
- [x] Create `backend/app/schemas/explanation.py`
- [x] Create `backend/app/schemas/rating.py`
- [x] Create `backend/app/schemas/admin.py`
- [x] Create `backend/app/services/auth_service.py` (JWT + bcrypt)
- [x] Create `backend/app/services/state_machine.py` (`validate_transition`)
- [x] Create `backend/app/services/snapi_client.py` (fetch + cache TTL + freshness)
- [x] Create `backend/app/services/openai_client.py` (structured output, token tracking)
- [x] Create `backend/app/services/explanation_service.py` (generate-or-retrieve)
- [x] Create `backend/app/dependencies.py` (`get_current_user`, `require_admin`)
- [x] Create `backend/app/routers/health.py` (GET /health with live DB query)
- [x] Create `backend/app/routers/auth.py` (register + login)
- [x] Create `backend/app/routers/articles.py` (feed + detail + state transition)
- [x] Create `backend/app/routers/explanations.py` (POST + GET history)
- [x] Create `backend/app/routers/ratings.py`
- [x] Create `backend/app/routers/users.py` (reading map)
- [x] Create `backend/app/routers/admin.py` (stats, admin only)
- [x] Create `backend/app/main.py` (app factory, router registration, CORS, lifespan)
- [x] Create `backend/.env.example`
- [x] Create `backend/tests/test_state_machine.py`
- [x] Create `backend/tests/test_explanation_service.py`
- [x] Create `backend/tests/test_auth.py`
- [x] Run `mypy app/` — zero errors
- [x] Run `ruff check app/` — zero errors
- [x] Run `pytest` — all pass

---

## FRONTEND ROLE — Ansible

- [x] Create `ansible/roles/frontend/tasks/main.yml` — install nginx, template .env.production locally, npm ci + build (delegate_to: localhost), copy dist/, template nginx.conf, firewalld, start/enable nginx
- [x] Create `ansible/roles/frontend/templates/nginx.conf.j2`
- [x] Create `ansible/roles/frontend/templates/env.production.j2`
- [x] Create `ansible/roles/frontend/handlers/main.yml`
- [x] Create `ansible/roles/frontend/defaults/main.yml`

---

## FRONTEND — Application Code

- [x] Create `frontend/package.json`
- [x] Create `frontend/vite.config.ts`
- [x] Create `frontend/tsconfig.json`
- [x] Create `frontend/index.html`
- [x] Create `frontend/src/main.tsx`
- [x] Create `frontend/src/App.tsx` (React Router v6 routes, PrivateRoute, AdminRoute)
- [x] Create `frontend/src/context/AuthContext.tsx` (JWT localStorage, login/logout)
- [x] Create `frontend/src/api/client.ts` (Axios instance, Bearer injection, 401 interceptor)
- [x] Create `frontend/src/api/auth.ts`
- [x] Create `frontend/src/api/articles.ts`
- [x] Create `frontend/src/api/explanations.ts`
- [x] Create `frontend/src/pages/Login.tsx`
- [x] Create `frontend/src/pages/Register.tsx`
- [x] Create `frontend/src/pages/Feed.tsx` (feed + state/freshness filters)
- [x] Create `frontend/src/pages/ArticleDetail.tsx` (detail + explanation modes + version history)
- [x] Create `frontend/src/pages/ReadingMap.tsx`
- [x] Create `frontend/src/pages/AdminDashboard.tsx`
- [x] Create `frontend/src/components/Nav.tsx`
- [x] Run `npx tsc --noEmit` — zero errors
- [x] Run `npm run lint` — zero errors
- [x] Manual browser test: full golden path (V3 editorial design verified visually; all routes functional)

---

## EXTRAS

- [x] EXTRA1: JWT auth — acceptance conditions verified (see PHASE3.md)
- [x] EXTRA2: RBAC — acceptance conditions verified (see PHASE3.md)
- [x] EXTRA3: Central logging — rsyslog on storage VM, forwarding from all tiers (Ansible)
  - [x] `ansible/roles/storage/templates/rsyslog-server.conf.j2`
  - [x] `ansible/roles/backend/templates/rsyslog-client.conf.j2`
  - [x] `ansible/roles/frontend/templates/rsyslog-client.conf.j2`
- [x] EXTRA4: AWS deployment — separate inventory, same roles, ProxyJump, document workflow

---

## ADDITIONAL FEATURES

- [x] Astronomical Events widget on Feed — `GET /astronomical/events?lat&lon`, curated annual event list + AstronomyAPI planet positions, horizontal scrollable card strip with Google Calendar URL links, browser geolocation + city-name geocoding via Nominatim, localStorage persistence. **Requires:** `vault_astronomy_app_id` + `vault_astronomy_app_secret` in `ansible/vault.yml` (user must add manually with `ansible-vault edit`).
- [x] V2 Editorial Redesign — `Home.tsx` at `/` with full editorial layout; Feed moved to `/browse`; Fraunces + JetBrains Mono fonts. See DESIGN/ROADMAP.md.
- [x] V3 Editorial Extension — all 5 screens (Login, Browse, ReadingMap, Cipher, Admin) redesigned to V3 spec; shared `EditorialShell.tsx` chrome; `editorial-v3.css`; topic facets on Browse; ReadingMap SVG constellation V3; cipher clue card. See DONE.md 2026-05-05.
- [ ] Admin token tracking via OpenAI Admin API — replace DB-summed token counts in `GET /admin/stats` with live data from OpenAI usage API. **Requires:** separate Admin API key stored as `vault_openai_admin_key` in vault. Low priority.

---

## VERIFICATION

- [x] Full deploy from clean state — single Ansible command, no manual steps
- [x] Idempotency — second run: zero changed, zero restarts (seed tasks `changed_when: false`)
- [x] Tier-specific redeploy — `--limit frontend/backend/storage`
- [x] Health checks — all three tiers respond correctly
- [x] Persisted-state proof — data survives full redeploy
- [x] Demo readiness — all graded items demonstrable (deployed on AWS)
- [x] Root-level symlinks verified: `PROJECT_README.md` → `PROJECT_DOCS/PROJECT_README.md`, `PROJECT_STRUCTURE.md` → `PROJECT_DOCS/PROJECT_STRUCTURE.md`

---

## COMPLETED THIS SESSION (2026-05-15) — idempotency + guard fixes + wordle bug

- [x] `backend/tasks/main.yml`: `changed_when: true` → `changed_when: false` on tar archive task — idempotency fix (change detection delegated to subsequent `copy` checksum task)
- [x] `frontend/tasks/main.yml`: added `when: ansible_distribution != "Amazon"` to `Keep openssh in sync` and `Allow nginx to connect to upstream backend (SELinux)` tasks (guards were documented but missing)
- [x] `backend/tasks/main.yml`: added `when: ansible_distribution != "Amazon"` to `Keep openssh in sync` task (guard was documented but missing)
- [x] `PROJECT_README.md`: updated tar task justification in `command`/`shell` table to reflect `changed_when: false` (not `true`)
- [x] Wordle spoiler fix (`frontend/src/pages/Wordle.tsx`): past puzzles archive now starts from yesterday when game is not yet over (`offset = gameOver ? i : i + 1`)
- [x] Full AWS redeploy verified: all three tiers ok, second run idempotent (0 changed, 0 restarts)

---

## COMPLETED THIS SESSION (2026-05-05) — requirements review pass

- [x] Duplicate group_vars fixed: `db_name`/`db_user`/`pg_port` removed from `storage.yml` (kept in `all.yml`)
- [x] State machine wired: `validate_transition` now called in `articles.py` (new→read) and `explanation_service.py` (read→explained)
- [x] `seed_admin.yml`: `DO UPDATE` → `DO NOTHING` + `changed_when: false`
- [x] `seed_wordle.yml`: `changed_when: false` added
- [x] README: `shell` module justification added for PGDG excludepkgs task
- [x] UI: `.ed-article-headline` now `color: var(--ed-ink)` — title no longer pale blue on light bg
- [x] UI: `.map-strip-row` right padding added — count label no longer flush at viewport edge
