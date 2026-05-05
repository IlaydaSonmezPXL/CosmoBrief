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
- [ ] Manual browser test: full golden path

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
- [ ] Admin token tracking via OpenAI Admin API — replace DB-summed token counts in `GET /admin/stats` with live data from OpenAI usage API (`GET https://api.openai.com/v1/organization/usage/completions`). **Requires:** separate Admin API key (not the inference key) — obtain from platform.openai.com → API keys → create Admin key. Store as `vault_openai_admin_key` in `ansible/vault.yml`. Add `openai_admin_api_key: Optional[str]` to `backend/app/config.py`. In `admin.py`, if key present call OpenAI usage endpoint for current month, fall back to DB sum if absent or API error. Token counts then survive VM destruction.

---

## VERIFICATION

- [ ] Full deploy from clean state — single Ansible command, no manual steps
- [ ] Idempotency — second run: zero changed, zero restarts
- [ ] Tier-specific redeploy — `--limit frontend/backend/storage`
- [ ] Health checks — all three tiers respond correctly
- [ ] Persisted-state proof — data survives full redeploy
- [ ] Demo readiness — all graded items demonstrable
