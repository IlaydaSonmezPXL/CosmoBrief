# Phase 2 — Backend Role + Backend Application Code

**Date completed:** 2026-05-01
**Scope:** Backend Ansible role, full FastAPI application, database migrations, schemas, services, routers, tests
**Status:** Complete. mypy: 0 errors, ruff: 0 errors, pytest: 33/33 passed.

---

## What Phase 2 Covers

Everything needed to deploy and run the backend tier:

- `ansible/roles/backend/` — full Ansible role (Python install, venv, code deploy, systemd service)
- `backend/requirements.txt` — all Python dependencies
- `backend/alembic.ini` + `backend/alembic/env.py` — async Alembic setup
- Alembic migrations for all 5 tables
- ORM models, Pydantic schemas, services, FastAPI routers
- `backend/app/main.py` — application factory
- `backend/.env.example` — local development template
- `backend/tests/` — unit tests for state machine, explanation service, auth service
- Quality checks: mypy, ruff, pytest

---

## Files Created

### Ansible Role

| File | Purpose |
|---|---|
| `ansible/roles/backend/defaults/main.yml` | `app_user`, `app_group`, `venv_dir`, `service_name`, `log_dir`, `python_bin` |
| `ansible/roles/backend/handlers/main.yml` | Reload systemd, Restart cosmobrief, Restart rsyslog (EXTRA3 hook) |
| `ansible/roles/backend/tasks/main.yml` | Full deploy sequence — see task sequence below |
| `ansible/roles/backend/templates/cosmobrief.env.j2` | Backend `.env` file with DB URL, JWT, OpenAI key via Vault |
| `ansible/roles/backend/templates/cosmobrief.service.j2` | systemd unit: gunicorn, EnvironmentFile, WorkingDirectory |
| `ansible/roles/backend/templates/gunicorn.conf.py.j2` | bind, workers, worker_class, log paths |
| `ansible/roles/backend/templates/rsyslog-client.conf.j2` | rsyslog forwarding to storage VM (EXTRA3) |

### Application Code

| File | Purpose |
|---|---|
| `backend/requirements.txt` | FastAPI, SQLAlchemy async, Alembic, PyJWT, passlib, openai, httpx, pytest |
| `backend/alembic.ini` | URL placeholder (overridden at runtime from `app.config.settings`) |
| `backend/alembic/env.py` | Async engine with `NullPool`, loads `settings.database_url`, registers all models |
| `backend/alembic/versions/a1b2c3d4e5f6_create_users.py` | `users` table |
| `backend/alembic/versions/b2c3d4e5f6a1_create_article_cache.py` | `article_cache` table |
| `backend/alembic/versions/c3d4e5f6a1b2_create_article_states.py` | `article_states` table + unique constraint + index |
| `backend/alembic/versions/d4e5f6a1b2c3_create_explanations.py` | `explanations` table + unique constraint |
| `backend/alembic/versions/e5f6a1b2c3d4_create_topic_tags.py` | `topic_tags` table + unique constraint |
| `backend/app/config.py` | pydantic-settings, all config from env vars, `# type: ignore[call-arg]` for mypy |
| `backend/app/db.py` | async engine, session factory, `get_db` dependency |
| `backend/app/models/user.py` | users ORM model |
| `backend/app/models/article_cache.py` | article_cache ORM model |
| `backend/app/models/article_state.py` | article_states ORM model |
| `backend/app/models/explanation.py` | explanations ORM model |
| `backend/app/models/topic_tag.py` | topic_tags ORM model |
| `backend/app/schemas/auth.py` | RegisterRequest, LoginRequest, TokenResponse (token_type default "bearer") |
| `backend/app/schemas/article.py` | ArticleSummary, ArticleListResponse, ArticleDetailResponse, state/freshness Literals |
| `backend/app/schemas/explanation.py` | ExplanationRequest, ExplanationResponse, ExplanationHistoryItem/Response |
| `backend/app/schemas/rating.py` | RatingRequest, RatingResponse |
| `backend/app/schemas/admin.py` | AdminStatsResponse, AdminTopicCount |
| `backend/app/services/auth_service.py` | hash_password, verify_password, create_access_token, decode_access_token |
| `backend/app/services/state_machine.py` | VALID_TRANSITIONS set, validate_transition(from_state, to_state) → bool |
| `backend/app/services/snapi_client.py` | SNAPI fetch (paginated), cache TTL check, freshness classification |
| `backend/app/services/openai_client.py` | GPT-4o-mini structured output (ExplanationOutput), token tracking |
| `backend/app/services/explanation_service.py` | get_or_generate_explanation: cache-hit/generate/regenerate logic |
| `backend/app/dependencies.py` | get_current_user (JWT → User), require_admin, http_error → NoReturn |
| `backend/app/routers/health.py` | GET /health with live SELECT 1 |
| `backend/app/routers/auth.py` | POST /auth/register (201), POST /auth/login (200) |
| `backend/app/routers/articles.py` | GET /articles (feed + filters), GET /articles/:id (detail + new→read) |
| `backend/app/routers/explanations.py` | POST /articles/:id/explanations (200 cached / 201 generated), GET history |
| `backend/app/routers/ratings.py` | POST /articles/:id/explanations/:mode/:version/rating |
| `backend/app/routers/users.py` | GET /users/:user_id/reading-map |
| `backend/app/routers/admin.py` | GET /admin/stats (require_admin) |
| `backend/app/main.py` | Router registration, CORS (allow_origins=["*"]), custom error handler |
| `backend/.env.example` | Local dev template (not committed to production) |
| `backend/pytest.ini` | asyncio_mode=auto, pythonpath=. |
| `backend/tests/conftest.py` | Sets env vars before import (DATABASE_URL, JWT_SECRET_KEY, OPENAI_API_KEY) |
| `backend/tests/test_state_machine.py` | parametrized valid/invalid transition cases |
| `backend/tests/test_explanation_service.py` | 7 scenarios with AsyncMock session + patched generate_explanation |
| `backend/tests/test_auth.py` | 7 tests: hash/verify, JWT roundtrip, token roles, tamper detection |

---

## Backend Role Task Sequence

```
1. Create system user (cosmobrief)                 [user]
2. Install Python 3.11 + devel + pip               [dnf]
3. Ensure app_dir exists (/opt/cosmobrief)         [file]
4. Ensure log_dir exists (/var/log/cosmobrief)     [file]
5. Copy backend source code                        [copy]
6. Render cosmobrief.env.j2 → .env                [template] → Restart cosmobrief
7. Render gunicorn.conf.py.j2                      [template] → Restart cosmobrief
8. Install dependencies in venv                    [pip]      → Restart cosmobrief
9. Run alembic upgrade head                        [command, changed_when detects output]
10. Deploy cosmobrief.service.j2                   [template] → Reload systemd + Restart cosmobrief
11. Enable and start cosmobrief service             [systemd]
12. Deploy rsyslog-client.conf.j2 (EXTRA3)         [template] → Restart rsyslog
13. Enable and start rsyslog (EXTRA3)               [systemd]
```

---

## Key Architectural Decisions

### `http_error` returns `NoReturn`

`app/dependencies.py` declares `http_error(...) -> NoReturn` because it always raises `HTTPException`. This lets mypy understand that code after `if not x: http_error(...)` is unreachable when x is None, eliminating all "None access" type errors throughout the routers without defensive coding.

### State machine — implicit "new" state

`validate_transition(None, to_state)` is the canonical check for "new" articles. No `article_state` record is ever pre-created for "new" articles. Records are created only on first user interaction. This is enforced in all routers: if `scalar_one_or_none()` returns None, the state is "new" (implicit).

### Explanation versioning with SELECT FOR UPDATE

`get_or_generate_explanation` acquires `SELECT FOR UPDATE` on the latest explanation row to prevent concurrent duplicate generation for the same (user_id, article_id, mode). The UNIQUE constraint on (user_id, article_id, mode, version) provides a safety net if the lock is insufficient.

### Alembic reads DATABASE_URL from .env

`alembic/env.py` imports `app.config.settings` at module level. The `.env` file is read by pydantic-settings relative to the working directory. The Ansible task uses `chdir: {{ app_dir }}` where `.env` lives. This ensures Alembic always connects to the correct database without hardcoding credentials.

### `classify_freshness` return type is `Literal[...]`

Changed from `str` to `Literal["fresh", "aging", "archived"]` to satisfy mypy when assigning to the schema's `Freshness` field without casting.

### SNAPI field names — snake_case in v4

SNAPI v4 changed from v3's camelCase to snake_case. The snapi_client uses `news_site`, `image_url`, `published_at` (snake_case). Using camelCase would silently return None for all these fields.

---

## mypy Fixes Applied

37 errors were found and fixed in the initial mypy run:

| File | Fix |
|---|---|
| `app/config.py` | `# type: ignore[call-arg]` — pydantic-settings uses dynamic field loading |
| `app/services/auth_service.py` | `# type: ignore[import-untyped]` — passlib has no type stubs |
| `app/services/snapi_client.py` | `params: dict[str, int] \| None` — fixes reassignment to None |
| `app/services/snapi_client.py` | `classify_freshness` return type → `Literal["fresh", "aging", "archived"]` |
| `app/dependencies.py` | `http_error` return type → `NoReturn` |
| `app/routers/articles.py` | `cast()` for state, explanations dict key, previous_state |
| `app/routers/explanations.py` | `cast()` for rating and source Literal types |

---

## ruff Fixes Applied

Two unused imports auto-fixed:
- `BigInteger` removed from `app/models/explanation.py`
- `Literal` removed from `app/schemas/rating.py`

---

## Before Deploying Backend

The backend role requires the storage role to have run first (PostgreSQL must be up, DB and user created). The Ansible playbook enforces this via play ordering (storage play 1 → backend play 2).

No manual steps are needed after `vagrant up` and `ansible-playbook`.

---

## Phase 3 Preview

Frontend phase covers:
- `ansible/roles/frontend/` full role (nginx, npm build, SELinux)
- `frontend/` React 18 + TypeScript application
- EXTRA3 central logging added to all three roles
