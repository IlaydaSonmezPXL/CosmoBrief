# CLAUDE.md

READ CLAUDEBEHAVIOR.md

READ ASSIGNMENT.md
READ AND WRITE PROJECT_README.md WHEN NECESSARY
READ AND WRITE PROJECT_STRUCTURE.md WHEN NECESSARY

ASK BEFORE CHANGING CLAUDE.md
IDEA IS FINAL. DO NOT CHANGE THE PROJECT IDEA WITHOUT EXPLICIT APPROVAL.

EVERYTHING IN ~/github/AutomationProject/PROJECT_DOCS IS USED TO DOCUMENT AND PERSIST THE:
- PROJECT IDEA (SEE ASSIGNMENT.md FOR SPECIFICATIONS)
- PROJECT STRUCTURE (SEE PROJECT_STRUCTURE.md)
- REQUIREMENTS (SEE REQUIREMENTS.md)
- IMPLEMENTATION PHASES (EVERYTHING IMPLEMENTED STEP BY STEP)
- TODO (ADD ALL TODOS TO TODO.md. MOVE TO DONE.md WHEN DONE. ANALYZE AND ASK BEFORE MOVING TO DONE)
- LEAVE EXTRAS LAST. DO THESE WHEN THE CORE PROJECT IS FINISHED (SEE ASSIGNMENT.md)
- WORK STEP BY STEP: STORAGE → BACKEND → FRONTEND
- FOLDER STRUCTURE IS DEFINED. FOLLOW IT EXACTLY.

---

## Project

Cosmo Brief — a space news reader where articles move through a defined state machine, AI-generated explanations are versioned and rated per user, and reading history builds a personal topic map over time.

---

## Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy (async), Alembic, gunicorn + uvicorn workers, systemd
- **Frontend:** React 18, Vite, React Router v6, Axios — built to static files, served by nginx
- **Database:** PostgreSQL 16 (PGDG repo), psycopg2/psycopg3
- **AI:** OpenAI Python SDK, model `gpt-4o-mini`, structured outputs for explanation + topic tag
- **Auth:** JWT (python-jose or PyJWT), bcrypt via passlib
- **Deployment:** Ansible, AlmaLinux 9, Vagrant (local) + AWS EC2 (extra)
- **Logging (EXTRA3):** rsyslog, central log receiver on storage VM

---

## Commands

All commands assume you are in the repo root unless otherwise specified.

**Backend — development:**
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend — run tests:**
```
cd backend && source venv/bin/activate
pytest                          # all tests
pytest tests/test_articles.py  # single file
pytest -k "test_state_machine" # single test by name
```

**Backend — type check (run after every change):**
```
cd backend && source venv/bin/activate && mypy app/
```

**Backend — lint:**
```
cd backend && source venv/bin/activate && ruff check app/
```

**Backend — run migrations (development):**
```
cd backend && source venv/bin/activate
alembic upgrade head
```

**Backend — generate new migration:**
```
cd backend && source venv/bin/activate
alembic revision --autogenerate -m "description_of_change"
```

**Frontend — development:**
```
cd frontend
npm install
npm run dev       # starts Vite dev server on http://localhost:5173
```

**Frontend — build (production):**
```
cd frontend
npm run build     # outputs to frontend/dist/
```

**Frontend — preview build locally:**
```
cd frontend && npm run preview
```

**Frontend — type check:**
```
cd frontend && npx tsc --noEmit
```

**Frontend — lint:**
```
cd frontend && npm run lint
```

**Deploy — full stack (local Vagrant, from repo root):**
```
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass
```

**Deploy — single tier only:**
```
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit storage
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit backend
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit frontend
```

**Deploy — AWS (from repo root, after provisioning):**
```
ansible-playbook -i inventory.ini ansible/playbook.yml --vault-password-file .vault_pass
```

**Vault — edit secrets:**
```
ansible-vault edit ansible/vault.yml --vault-password-file .vault_pass
```

**Pre-compute admin bcrypt hash (one-time, run locally):**
```
cd backend && source venv/bin/activate
python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('YOUR_ADMIN_PASSWORD'))"
```
Store the result in `ansible/vault.yml` as `vault_admin_password_hash`.

---

## Architecture

```
AutomationProject/
├── backend/                   → FastAPI application
│   ├── app/
│   │   ├── main.py            → FastAPI app entry point, router registration, CORS, lifespan
│   │   ├── config.py          → Settings loaded from env vars via pydantic-settings
│   │   ├── db.py              → Async SQLAlchemy engine, session factory, get_db dependency
│   │   ├── routers/           → One file per API domain
│   │   │   ├── auth.py        → POST /auth/register, POST /auth/login
│   │   │   ├── articles.py    → GET /articles, GET /articles/:id, POST /articles/:id/state
│   │   │   ├── explanations.py→ POST /articles/:id/explanations, GET history
│   │   │   ├── ratings.py     → POST /articles/:id/explanations/:mode/:ver/rating
│   │   │   ├── users.py       → GET /users/:id/reading-map
│   │   │   ├── admin.py       → GET /admin/stats (admin role only)
│   │   │   └── health.py      → GET /health
│   │   ├── models/            → SQLAlchemy ORM models (one file per table)
│   │   │   ├── user.py
│   │   │   ├── article_state.py
│   │   │   ├── article_cache.py
│   │   │   ├── explanation.py
│   │   │   └── topic_tag.py
│   │   ├── schemas/           → Pydantic request/response models
│   │   │   ├── auth.py
│   │   │   ├── article.py
│   │   │   ├── explanation.py
│   │   │   ├── rating.py
│   │   │   └── admin.py
│   │   ├── services/          → Business logic (no direct route handling)
│   │   │   ├── state_machine.py  → Article state transition validation and enforcement
│   │   │   ├── explanation_service.py → Generate-or-retrieve decision logic
│   │   │   ├── snapi_client.py   → SNAPI fetch + freshness classification + cache TTL
│   │   │   ├── openai_client.py  → OpenAI call, structured output parsing
│   │   │   └── auth_service.py   → JWT creation/validation, password hashing
│   │   └── dependencies.py    → get_current_user, require_admin FastAPI dependencies
│   ├── alembic/               → Database migrations
│   │   ├── versions/          → Migration files (never delete these)
│   │   └── env.py
│   ├── tests/
│   │   ├── test_state_machine.py
│   │   ├── test_explanation_service.py
│   │   └── test_auth.py
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/                  → React + Vite application
│   ├── src/
│   │   ├── main.jsx           → React entry point
│   │   ├── App.jsx            → Router setup
│   │   ├── api/               → Axios instances and typed API call wrappers
│   │   │   ├── client.js      → Axios instance with base URL + auth header injection
│   │   │   ├── articles.js
│   │   │   ├── explanations.js
│   │   │   └── auth.js
│   │   ├── components/        → Reusable UI components
│   │   ├── pages/             → Route-level page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Feed.jsx
│   │   │   ├── ArticleDetail.jsx
│   │   │   ├── ReadingMap.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── hooks/             → Custom React hooks
│   │   └── context/           → AuthContext (JWT storage + user state)
│   ├── .env.production        → Templated by Ansible. Contains VITE_API_URL only.
│   ├── package.json
│   └── vite.config.js
│
├── storage/                   → Storage-tier setup (no application code)
│   └── init/                  → Reference SQL for schema documentation only
│                                 (Alembic is the source of truth for schema)
│
├── ansible/                   → All Ansible code
│   ├── playbook.yml           → Entry point: three plays targeting frontend/backend/storage groups
│   ├── roles/
│   │   ├── frontend/          → Install nginx, build frontend, copy dist, template nginx.conf
│   │   ├── backend/           → Install Python, create venv, copy app, template .env, systemd service
│   │   └── storage/           → Install PostgreSQL 16, create DB + user, run Alembic, seed admin
│   ├── group_vars/
│   │   ├── all.yml            → app_name, backend_port, shared non-secret vars
│   │   ├── frontend.yml       → frontend_http_port (8080 local / 80 AWS)
│   │   ├── backend.yml        → python_version, app_dir, gunicorn_workers
│   │   └── storage.yml        → postgresql_version (16), db_name, db_user, pg_port (5432)
│   ├── host_vars/             → Host-specific overrides if needed
│   └── vault.yml              → Ansible Vault encrypted secrets (see Secrets section)
│
├── local-deploy/              → Vagrant infrastructure (do not modify application logic here)
│   ├── Vagrantfile            → Three AlmaLinux 9 VMs (10.10.0.10/20/30)
│   ├── inventory.ini          → Ansible inventory for local VMs
│   ├── ansible.cfg            → Points to inventory.ini
│   └── playbook.yml           → Empty stub. Real playbook is at ansible/playbook.yml.
│
├── provisioning/              → AWS provisioning scripts (do not modify)
│   └── PE2_PROVISIONING_QUICK_START.md
│
├── PROJECT_DOCS/              → Project documentation and planning
│   ├── ASSIGNMENT.md          → Original assignment spec (read-only)
│   ├── CLAUDE.md              → This file
│   ├── CLAUDEBEHAVIOR.md      → Behavioral rules (read-only)
│   ├── REQUIREMENTS.md        → Full requirements document (source of truth)
│   ├── TODO.md                → Active tasks
│   └── DONE.md                → Completed tasks
│
├── PROJECT_README.md          → Submission entry doc
├── PROJECT_STRUCTURE.md       → Submission structure doc
├── .vault_pass                → Vault password file (git-ignored, never committed)
└── .gitignore
```

---

## Rules

**Ansible rules — these are graded and breaking them caps the score:**
- NEVER hardcode an IP address in a playbook or template. Always use `{{ hostvars[...]['ansible_host'] }}` or group/host vars.
- NEVER use the `command` or `shell` module unless no suitable module exists. If used, document the justification in PROJECT_README.md immediately.
- NEVER duplicate variable definitions across group_vars files. Each variable lives in exactly one place.
- NEVER run `initdb`, `createdb`, `createuser`, or schema creation unconditionally. All DB setup tasks must be guarded with `creates:`, `when:`, or idempotent modules.
- The Alembic `upgrade head` task runs on every deploy (it is idempotent — if no new migrations exist, it is a no-op). Do not guard it with a `when:` condition.
- Admin user seeding uses `community.postgresql.postgresql_query` with `ON CONFLICT DO NOTHING`. Never use the `uri` module to call the backend for seeding.
- `ansible/vault.yml` contains ALL secrets. No secret string appears anywhere else.
- Configuration files deployed to VMs use Jinja2 templates. No static config files with hardcoded values.

**Backend rules:**
- All business logic lives in `services/`. Routers only parse requests, call services, and return responses.
- The state machine transition table in `services/state_machine.py` is the single source of truth for valid transitions. Do not add transition logic in routers.
- NEVER call the OpenAI API directly from a router. All AI calls go through `services/openai_client.py`.
- The `article_state` record for a user is only created when the user first interacts with an article. "new" state is the implicit absence of a record. Do not pre-create records.
- `alembic/versions/` files are never deleted or modified after creation. Write a new migration to undo a previous one.
- `config.py` uses `pydantic-settings` to load all configuration from environment variables. No `os.getenv()` calls outside `config.py`.
- Run `mypy app/` after every code change. Fix all type errors before considering the change done.

**Frontend rules:**
- `VITE_API_URL` is the only environment variable. It is injected by Ansible via `.env.production` at build time.
- The Axios client instance in `api/client.js` is the only place where the `Authorization` header is set. Do not add auth headers anywhere else.
- JWT is stored in `localStorage`. On 401 responses, the Axios interceptor clears the token and redirects to `/login`.
- Admin routes are protected at the backend. The frontend hides the admin UI only as a UX convenience — do not rely on frontend guards for security.
- `dist/` is git-ignored. It is generated by Ansible during deployment via `delegate_to: localhost`.

**General rules:**
- IMPORTANT: Never commit `.vault_pass`, `.env`, or any file containing plaintext secrets.
- IMPORTANT: Never commit `frontend/dist/`. It is a build artifact.
- Never modify `local-deploy/Vagrantfile` or `local-deploy/inventory.ini` for application logic.
- Never touch `provisioning/` scripts — they are assignment-provided infrastructure.
- Do not add Python packages to `requirements.txt` speculatively. Only add a package when it is actually used.

---

## Workflow

**Implementation order: storage role → backend role → frontend role → extras (EXTRA1 is core, EXTRA2/3/4 are extras)**

**For each task:**
1. State the goal and success criteria before writing code.
2. Write the minimum code that satisfies the goal.
3. Run the relevant type check and lint commands.
4. Update TODO.md and DONE.md accordingly.
5. Commit with a single logical commit message per change.

**Commit conventions:**
- `feat(storage): add article_states table migration`
- `feat(backend): implement state machine enforcement`
- `fix(backend): handle missing article_state record as new`
- `ansible(storage): add postgresql 16 install tasks`
- `ansible(backend): template gunicorn systemd service`
- `docs: update PROJECT_STRUCTURE.md`

**Testing expectations:**
- Backend: pytest for state machine logic and explanation service logic. These are the two most complex components and must have tests.
- Frontend: no unit tests required. Manual testing via browser is sufficient for this assignment scope.
- Ansible: verify idempotency by running the playbook twice and confirming the second run shows 0 changes.

**When to ask vs when to act:**
- Ask before making any architectural decision not already specified in REQUIREMENTS.md or this file.
- Ask before adding any new dependency (Python package or npm package).
- Ask before modifying the database schema in a way that requires a destructive migration.
- Act on implementation details within the defined architecture without asking.

---

## Secrets managed by Ansible Vault (vault.yml)

All of the following live in `ansible/vault.yml` and nowhere else:

| Variable | Description |
|---|---|
| `vault_db_password` | PostgreSQL application user password |
| `vault_db_admin_password` | PostgreSQL superuser password (postgres user) |
| `vault_jwt_secret_key` | JWT signing secret (min 32 chars, random) |
| `vault_openai_api_key` | OpenAI API key |
| `vault_astronomy_app_id` | AstronomyAPI application ID |
| `vault_astronomy_app_secret` | AstronomyAPI application secret |
| `vault_admin_username` | Admin application account username |
| `vault_admin_email` | Admin application account email |
| `vault_admin_password_hash` | Pre-computed bcrypt hash of admin password |

Referenced in templates and tasks via their vault variable names directly (no separate non-vault alias needed).

---

## Out of scope

- `local-deploy/Vagrantfile` — do not modify
- `local-deploy/inventory.ini` — do not modify
- `provisioning/` — do not modify any file in this directory
- `PROJECT_DOCS/ASSIGNMENT.md` — read-only, never modify
- `PROJECT_DOCS/CLAUDEBEHAVIOR.md` — read-only, never modify
- `.github/` — do not create or modify CI/CD workflows
- Docker — not used in this project
- Redis — not used (article caching is handled by the `article_cache` PostgreSQL table)
- WebSockets — not used
- HTTPS/TLS — not required for the local Vagrant environment or the assignment demo

## VERY IMPORTANT

- IMPORTANT: Run `mypy app/` after every backend code change. Do not proceed if there are type errors.
- IMPORTANT: Run `npx tsc --noEmit` after every frontend code change.
- Make minimal changes. Do not refactor adjacent code that is not broken.
- Create one commit per logical change. Never bundle unrelated changes.
- When unsure about an architectural choice, stop and explain the options. Do not pick silently.
- Never add speculative features, abstractions, or error handling beyond what the requirements specify.
- The playbook must be idempotent. After every Ansible change, mentally verify: "Would running this twice produce a changed task on the second run?" If yes, fix it before committing.
- `ansible/vault.yml` must be encrypted at all times when committed. Never commit a decrypted vault file.
