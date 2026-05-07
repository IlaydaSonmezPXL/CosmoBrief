# Project Structure — Cosmo Brief

This document describes the technical organization of the monorepo, all commands needed to build, test, run, and deploy the project, and how the parts relate to each other.

---

## Directory Tree

```
AutomationProject/
│
├── backend/                          # FastAPI application (Python 3.11)
│   ├── app/
│   │   ├── main.py                   # FastAPI app factory, router registration, CORS, lifespan
│   │   ├── config.py                 # All settings loaded from env vars via pydantic-settings
│   │   ├── db.py                     # Async SQLAlchemy engine, session factory, get_db dependency
│   │   ├── dependencies.py           # get_current_user, require_admin FastAPI dependencies
│   │   ├── routers/
│   │   │   ├── auth.py               # POST /auth/register, POST /auth/login
│   │   │   ├── articles.py           # GET /articles (supports ?q=, ?topic=, ?state=, ?freshness=), GET /articles/topics, GET /articles/:id
│   │   │   ├── explanations.py       # POST /articles/:id/explanations, GET history
│   │   │   ├── ratings.py            # POST /articles/:id/explanations/:mode/:ver/rating
│   │   │   ├── users.py              # GET /users/me, PATCH /users/me, DELETE /users/me/data, GET /users/:id/reading-map
│   │   │   ├── admin.py              # GET /admin/stats, GET /admin/users (admin role only)
│   │   │   ├── wordle.py             # GET /wordle/words (authenticated, returns word list from DB)
│   │   │   ├── astronomical.py       # GET /astronomical/events?lat&lon — curated events + AstronomyAPI planet proxy
│   │   │   └── health.py             # GET /health (includes live DB query)
│   │   ├── models/                   # SQLAlchemy ORM models (one file per table)
│   │   │   ├── user.py               # users table
│   │   │   ├── article_state.py      # article_states table
│   │   │   ├── article_cache.py      # article_cache table
│   │   │   ├── explanation.py        # explanations table
│   │   │   ├── topic_tag.py          # topic_tags table
│   │   │   └── wordle_word.py        # wordle_words table
│   │   ├── schemas/                  # Pydantic v2 request/response models
│   │   │   ├── auth.py
│   │   │   ├── article.py            # ArticleSummary, ArticleListResponse, TopicCount, ArticleTopicsResponse, ReadingMap schemas
│   │   │   ├── explanation.py
│   │   │   ├── rating.py
│   │   │   ├── admin.py              # AdminStatsResponse, AdminUserSummary, AdminUsersResponse
│   │   │   ├── users.py              # UserMeResponse, UpdateMeRequest
│   │   │   ├── wordle.py             # WordleWordsResponse
│   │   │   └── astronomical.py       # AstronomicalEvent, AstronomicalEventsResponse
│   │   └── services/                 # All business logic (no direct DB access in routers)
│   │       ├── state_machine.py      # validate_transition(from, to) — single source of truth
│   │       ├── explanation_service.py # Generate-or-retrieve decision logic
│   │       ├── snapi_client.py       # SNAPI fetch, freshness classification, cache TTL logic
│   │       ├── openai_client.py      # OpenAI structured output call, token tracking
│   │       └── auth_service.py       # JWT create/verify, bcrypt hash/verify
│   ├── alembic/
│   │   ├── versions/                 # Migration files — never delete or modify after creation
│   │   │                             # includes f6a1b2c3d4e5_create_wordle_words.py
│   │   ├── env.py                    # Alembic env using async SQLAlchemy engine from app
│   │   └── script.py.mako
│   ├── tests/                        # Backend unit tests (pytest + pytest-asyncio)
│   ├── alembic.ini                   # Alembic config (DB URL read from env at runtime)
│   └── requirements.txt              # Pinned production + dev dependencies
│
├── DESIGN/                           # UI/UX documentation and feature roadmap
│   ├── THEME.md                      # CSS token system, colour palette, typography, spacing, design principles
│   ├── COMPONENTS.md                 # Copy-paste class patterns for every UI component
│   └── ROADMAP.md                    # Planned UI features (Space Wordle, Reading Map enhancements)
│
├── frontend/                         # React 18 + Vite + TypeScript application
│   ├── src/
│   │   ├── main.tsx                  # React entry point, ReactDOM.createRoot; sets data-theme from localStorage
│   │   ├── index.css                 # Global dark space theme; V2 editorial CSS (scoped to .editorial); dark theme variants
│   │   ├── editorial-v3.css          # V3 editorial theme: all --ink/--paper/--accent tokens + all screen styles
│   │   │                             # (masthead, brand bar, tab nav, footer, login, browse, map, cipher, admin)
│   │   ├── App.tsx                   # Route definitions: / → Home, /browse → Feed, all routes wrapped in EditorialShell
│   │   ├── api/
│   │   │   ├── client.ts             # Axios instance: base URL from VITE_API_URL, Bearer injection, 401 interceptor
│   │   │   ├── articles.ts           # listArticles (topic/state/freshness/q/limit/offset), getArticle, getArticleTopics
│   │   │   ├── explanations.ts       # Typed wrappers for explanation + rating endpoints
│   │   │   ├── auth.ts               # Typed wrappers for register + login
│   │   │   ├── wordle.ts             # getWordleWords() — fetches word list from backend
│   │   │   ├── users.ts              # getMe, updateMe, wipeUserData — user settings API wrappers
│   │   │   └── astronomical.ts       # getAstronomicalEvents(lat?, lon?) — fetches events from backend
│   │   ├── components/
│   │   │   ├── EditorialShell.tsx    # Shared V3 chrome: Masthead + BrandBar + sticky TabNav + Footer
│   │   │   │                         # Auth-conditional: chips/tabs hidden for unauthenticated users
│   │   │   │                         # Live stats (article count, fresh count) + location pill in masthead
│   │   │   ├── EdNav.tsx             # Legacy V2 paper nav (used on older page variants; kept for reference)
│   │   │   ├── Nav.tsx               # Legacy dark nav (kept for non-editorial contexts)
│   │   │   ├── UserMenu.tsx          # Dropdown: Menu / Settings (theme swatches + data wipe) / Account (update profile)
│   │   │   ├── EarthIcon.tsx         # SVG Earth icon
│   │   │   ├── ScrollToTop.tsx       # Scrolls window to top on every route change
│   │   │   └── AstronomicalEvents.tsx # Astronomical events widget: location bar, city geocoding, horizontal card strip
│   │   ├── pages/
│   │   │   ├── Login.tsx             # V3 split-pane: editorial hero left + form right; § Subscriber Entrance
│   │   │   ├── Register.tsx          # V3 same template; § New Subscription
│   │   │   ├── Home.tsx              # V2 editorial home (/) — masthead, brand bar, section nav, hero, sky, long reads,
│   │   │   │                         # wire, orbit donut, wordle promo, footer — all inside EditorialShell
│   │   │   ├── Feed.tsx              # Browse (/browse) — V3 dense newspaper rows; search, topic/state/freshness
│   │   │   │                         # facets, pagination; AstronomicalEvents widget above list
│   │   │   ├── ArticleDetail.tsx     # Detail view: explanation modes, ratings, version history
│   │   │   ├── ReadingMap.tsx        # V3 SVG constellation (viewBox 600×480, grid + circles + crosshair);
│   │   │   │                         # topic stars sized by read count; click star → panel with 3 stats + threads list
│   │   │   ├── Wordle.tsx            # V3 Daily Cipher: board + keyboard + side panel (cipher clue card +
│   │   │   │                         # stats + distribution + archive + share); localStorage per user+date
│   │   │   └── AdminDashboard.tsx    # V3 Newsroom Desk: 4-stat head + token meter + subscribers table + signal queue
│   │   └── context/
│   │       └── AuthContext.tsx       # JWT storage in localStorage, user state, login/logout
│   ├── .env.production               # GENERATED by Ansible. Contains only VITE_API_URL.
│   │                                 # Do not edit manually. Do not commit.
│   ├── dist/                         # BUILD OUTPUT. Git-ignored. Generated by npm run build.
│   ├── index.html                    # SPA entry point
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json                 # TypeScript config: strict, vite/client types
│   └── vite.config.ts                # @vitejs/plugin-react, output to dist/
│
├── storage/
│   └── init/
│       └── schema_reference.sql      # Human-readable schema reference only.
│                                     # Alembic is the authoritative schema source. This file
│                                     # is documentation, not executed by Ansible.
│
├── ansible/
│   ├── playbook.yml                  # Entry point: four plays (storage, backend, frontend, seed)
│   │                                 # Play 4 seeds admin user AND wordle word list
│   ├── vault.yml                     # Ansible Vault encrypted secrets (NEVER commit decrypted)
│   ├── requirements.yml              # Galaxy collections: community.postgresql ≥3.0.0, ansible.posix ≥1.5.0
│   ├── roles/
│   │   ├── storage/
│   │   │   ├── tasks/
│   │   │   │   ├── main.yml          # Install PG16, disable AppStream module, initdb,
│   │   │   │   │                     # exclude openssl* from PGDG repos (prevents sshd ABI break),
│   │   │   │   │                     # keep openssh in sync with current openssl-libs,
│   │   │   │   │                     # configure pg_hba.conf, create DB + user, run Alembic,
│   │   │   │   │                     # seed admin user, configure rsyslog (EXTRA3)
│   │   │   │   ├── seed_admin.yml    # Admin user seed (ON CONFLICT DO NOTHING, idempotent)
│   │   │   │   └── seed_wordle.yml   # Wordle word list seed (94 space words, ON CONFLICT DO NOTHING)
│   │   │   ├── templates/
│   │   │   │   ├── pg_hba.conf.j2    # PostgreSQL client authentication config
│   │   │   │   ├── postgresql.conf.j2 # PostgreSQL server config (listen_addresses, etc.)
│   │   │   │   └── rsyslog-server.conf.j2 # Central rsyslog receiver config (EXTRA3)
│   │   │   ├── handlers/
│   │   │   │   └── main.yml          # restart postgresql-16, restart rsyslog, restart sshd
│   │   │   └── defaults/
│   │   │       └── main.yml          # postgresql_version: "16", pg_port: 5432, db_name, db_user
│   │   │
│   │   ├── backend/
│   │   │   ├── tasks/
│   │   │   │   └── main.yml          # Create system user, install python3.11 + python3.11-devel + rsync,
│   │   │   │                         # keep openssh in sync with current openssl-libs,
│   │   │   │                         # create venv, upgrade pip to latest (fixes bundled pip "from
│   │   │   │                         # versions: none" on AlmaLinux 9), pip install -r requirements.txt,
│   │   │   │                         # synchronize app code via ansible.posix.synchronize
│   │   │   │                         # (excludes venv/__pycache__/pyc — venv built remote-side),
│   │   │   │                         # template .env, run alembic upgrade head,
│   │   │   │                         # deploy systemd service, start/enable service
│   │   │   ├── templates/
│   │   │   │   ├── cosmobrief.env.j2 # Backend environment file (DB URL, JWT secret, OpenAI key)
│   │   │   │   ├── cosmobrief.service.j2 # systemd service unit for gunicorn
│   │   │   │   └── gunicorn.conf.py.j2   # gunicorn workers, bind, log paths
│   │   │   ├── handlers/
│   │   │   │   └── main.yml          # restart cosmobrief, reload systemd, restart rsyslog, restart sshd
│   │   │   └── defaults/
│   │   │       └── main.yml          # app_dir, app_user, backend_port: 8000, gunicorn_workers
│   │   │
│   │   └── frontend/
│   │       ├── tasks/
│   │       │   └── main.yml          # Install nginx, keep openssh in sync with current openssl-libs,
│   │       │                         # template .env.production locally,
│   │       │                         # run npm ci + npm run build (delegate_to: localhost),
│   │       │                         # synchronize dist/ to VM, template nginx.conf,
│   │       │                         # open firewalld port, start/enable nginx,
│   │       │                         # configure rsyslog forwarding (EXTRA3)
│   │       ├── templates/
│   │       │   ├── nginx.conf.j2     # Server block: port, root, /api/ proxy_pass, /health
│   │       │   ├── env.production.j2 # VITE_API_URL=http://{{ backend_ip }}:{{ backend_port }}
│   │       │   └── rsyslog-client.conf.j2 # Forward logs to storage VM (EXTRA3)
│   │       ├── handlers/
│   │       │   └── main.yml          # reload nginx, restart rsyslog, restart sshd
│   │       └── defaults/
│   │           └── main.yml          # frontend_http_port: 8080, webroot: /var/www/cosmobrief
│   │
│   └── group_vars/
│       ├── all.yml                   # app_name: cosmobrief, snapi_cache_ttl_minutes: 15
│       ├── frontend.yml              # frontend_http_port: 8080
│       ├── backend.yml               # backend_port: 8000, python_version: "3.11", gunicorn_workers formula
│       └── storage.yml               # postgresql_version: "16", db_name, db_user, pg_port: 5432
│
├── local-deploy/
│   ├── Vagrantfile                   # Three AlmaLinux 9 VMs at .10/.20/.30 — DO NOT MODIFY
│   ├── inventory.ini                 # Ansible inventory for local VMs — DO NOT MODIFY
│   ├── ansible.cfg                   # host_key_checking=False, inventory=inventory.ini (local use)
│   ├── playbook.yml                  # Empty stub (---). Real playbook: ansible/playbook.yml
│   ├── clean_known_hosts.sh          # Clears stale SSH known_hosts entries after vagrant destroy
│   └── nuke_all_vagrant.sh           # Destroys all Vagrant/libvirt state (dry run by default)
│
├── provisioning/                     # AWS provisioning — DO NOT MODIFY
│   ├── PE2_PROVISIONING_QUICK_START.md
│   ├── provision_pe2_nat_bastion.sh
│   └── teardown_pe2_nat_bastion.sh
│
├── DESIGN/                           # UI/UX documentation
│   ├── THEME.md                      # CSS token system, colour palette, typography, design principles
│   ├── COMPONENTS.md                 # Copy-paste class patterns for every UI component
│   └── ROADMAP.md                    # Planned UI features, design decisions
│
├── PROJECT_PHASES/                   # Phase-by-phase implementation notes
│   ├── PHASE1.md                     # Storage role (PostgreSQL, Alembic, seeding)
│   ├── PHASE2.md                     # Backend role + application code
│   ├── PHASE3.md                     # Frontend role + application code
│   └── PHASE4.md                     # Extras (central logging, AWS deployment)
│
├── CosmicBrief-V2/                   # V2 design handoff artifacts (reference only)
│   └── design_handoff_cosmo_brief_editorial/
│
├── CosmoBrief-V3/                    # V3 design handoff artifacts (reference only)
│   └── design_handoff_cosmo_brief_screens/
│
├── PROJECT_DOCS/
│   ├── ASSIGNMENT.md                 # Original spec — read-only
│   ├── CLAUDE.md                     # Agentic coding instructions — ask before changing
│   ├── CLAUDEBEHAVIOR.md             # Behavioral guidelines — read-only
│   ├── REQUIREMENTS.md               # Full requirements document — source of truth
│   ├── PROJECT_README.md             # Submission entry document (canonical location)
│   ├── PROJECT_STRUCTURE.md          # This file (canonical location)
│   ├── TODO.md                       # Active implementation tasks
│   ├── DONE.md                       # Completed tasks
│   └── TROUBLESHOOTING.md            # Known deployment issues + recovery (e.g. OpenSSL/OpenSSH ABI break on stock generic/alma9)
│
├── .claude/
│   └── settings.json                 # Claude Code permissions
├── .vault_pass                       # Vault password — GIT-IGNORED, NEVER COMMIT
├── .gitignore
├── pe2.png                           # Assignment image asset
├── PROJECT_README.md                 # Symlink → PROJECT_DOCS/PROJECT_README.md (required at root for grader)
└── PROJECT_STRUCTURE.md              # Symlink → PROJECT_DOCS/PROJECT_STRUCTURE.md (required at root for grader)
```

---

## Where Things Live

| Concern | Location |
|---|---|
| Frontend source code | `frontend/src/` |
| Frontend build output | `frontend/dist/` (git-ignored, generated at deploy time) |
| Backend source code | `backend/app/` |
| Database migrations | `backend/alembic/versions/` |
| Backend tests | `backend/tests/` |
| Storage schema reference | `storage/init/schema_reference.sql` |
| Ansible playbook entry point | `ansible/playbook.yml` |
| Ansible roles | `ansible/roles/{frontend,backend,storage}/` |
| Ansible group variables | `ansible/group_vars/` |
| Ansible host variables | `ansible/host_vars/` (created only if host-specific overrides needed) |
| Vault secrets | `ansible/vault.yml` (encrypted) |
| Local inventory | `local-deploy/inventory.ini` |
| AWS inventory | `inventory.ini` (repo root, git-ignored, generated by provisioning script) |

---

## Build Commands

### Frontend build (production)

Run from: `frontend/`

```bash
npm ci
npm run build
```

Output: `frontend/dist/` — static HTML, CSS, JS, assets.

> **Note:** During Ansible deployment, this build runs automatically on the Ansible control node via `delegate_to: localhost`. You do not need to run this manually before deploying.

### Backend — no build step

Python does not require compilation. Dependencies are installed into a virtualenv on the target VM by Ansible. No local build step is needed.

---

## Test Commands

### Backend tests

Run from: `backend/`

```bash
# Setup (first time)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run all tests
pytest

# Run a single test file
pytest tests/test_state_machine.py

# Run a single test by name
pytest -k "test_invalid_transition_new_to_explained"

# Run with coverage
pytest --cov=app --cov-report=term-missing
```

### Type checking

Run from: `backend/`

```bash
source venv/bin/activate && mypy app/
```

Run from: `frontend/`

```bash
npx tsc --noEmit
```

### Linting

Run from: `backend/`

```bash
source venv/bin/activate && ruff check app/
```

Run from: `frontend/`

```bash
npm run lint
```

---

## Local Development Commands

### Run backend locally

Run from: `backend/`

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create local .env file (not committed):
cp .env.example .env
# Edit .env with local PostgreSQL credentials and a test OpenAI key

# Apply migrations to local DB
alembic upgrade head

# Start dev server with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### Run frontend locally

Run from: `frontend/`

```bash
npm install

# Create local .env file (overrides .env.production for dev):
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Frontend available at: http://localhost:5173

The frontend dev server proxies nothing — `VITE_API_URL` points directly at the backend.

### Generate a new database migration

Run from: `backend/` with venv activated and local `.env` sourced:

```bash
alembic revision -m "add_prompt_tokens_to_explanations"

# Edit the new file in alembic/versions/ manually, then apply
alembic upgrade head
```

---

## Deployment Commands

### Local Vagrant deployment

**Prerequisites:** Vagrant + vagrant-libvirt installed. `ansible/vault.yml` populated and `.vault_pass` present at repo root.

Run from: `local-deploy/` (machines) then repo root (deployment):

```bash
# Step 1: Start the three VMs (one-time, ~2-5 minutes)
cd local-deploy
vagrant up

# Step 2: Verify SSH connectivity
ansible all -m ping -i local-deploy/inventory.ini

# Step 3: Deploy the full application (single command, from repo root)
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass
```

### Redeploy a single tier

Run from: repo root

```bash
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit storage
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit backend
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit frontend
```

### Verify idempotency

Run from: repo root

```bash
# Run the full playbook a second time against the live system.
# Expected result: all tasks report "ok", zero "changed", no service restarts.
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass
```

### Clean up local VMs

Run from: `local-deploy/`

```bash
vagrant destroy -f

# If SSH known_hosts entries are stale after recreating machines:
./clean_known_hosts.sh
```

---

## AWS Deployment Commands (EXTRA4)

### Prerequisites

- AWS Academy credentials configured (`~/.aws/credentials`)
- `provisioning/PE2_PROVISIONING_QUICK_START.md` reviewed

### Step 1 — Provision AWS infrastructure

Run from: **repo root** (the scripts write generated files to the current working directory):

```bash
chmod +x provisioning/provision_pe2_nat_bastion.sh provisioning/teardown_pe2_nat_bastion.sh
./provisioning/provision_pe2_nat_bastion.sh
```

This script creates the VPC, subnets, security groups, and three EC2 instances. It writes `inventory.ini`, `ansible.cfg`, `provisioned_vars.yml`, and `pe2_state.env` to the repo root (all git-ignored). The generated `inventory.ini` configures ProxyJump through the frontend public IP so Ansible can reach the private-subnet backend and storage hosts.

### Step 2 — Verify Ansible connectivity

```bash
ansible all -m ping
```

All three hosts must respond before deploying.

### Step 3 — Deploy the application

Run from: repo root

```bash
ansible-playbook -i inventory.ini ansible/playbook.yml --vault-password-file .vault_pass -e "frontend_http_port=80"
```

The same `ansible/playbook.yml` and all three roles are used for both Vagrant and AWS. The extra variable `frontend_http_port=80` overrides the group_vars default (8080 for Vagrant) so nginx listens on port 80 and the Vite build bakes in the correct URL. No committed files differ between the two environments.

### Step 4 — Verify deployment

```bash
# Read the frontend public IP from the generated inventory
FRONTEND_IP=$(grep '^frontend ' inventory.ini | grep -oP 'ansible_host=\K[^ ]+')

# Health checks
curl http://${FRONTEND_IP}/health
curl http://${FRONTEND_IP}/api/health
```

### Step 5 — Tear down

Run from: **repo root**:

```bash
./provisioning/teardown_pe2_nat_bastion.sh
```

This destroys all AWS resources created by the provisioning script. Verify in the AWS console that no resources remain to avoid billing.

---

## Important Configuration Files and Templates

| File | Location | Description |
|---|---|---|
| `playbook.yml` | `ansible/` | Entry point. Four plays: `hosts: storage`, `hosts: backend`, `hosts: frontend`, and a fourth `hosts: storage` seed play. The seed play runs after the backend play so that Alembic has already created the `users` and `wordle_words` tables. Seeds admin user (`seed_admin.yml`) and wordle word list (`seed_wordle.yml`), both idempotent via `ON CONFLICT DO NOTHING`. |
| `vault.yml` | `ansible/` | Ansible Vault encrypted. Contains all secrets. Never commit decrypted. |
| `all.yml` | `ansible/group_vars/` | Variables shared across all tiers: `app_name`, `snapi_cache_ttl_minutes`. |
| `frontend.yml` | `ansible/group_vars/` | `frontend_http_port: 8080` (Vagrant default). Pass `-e "frontend_http_port=80"` when deploying to AWS. |
| `backend.yml` | `ansible/group_vars/` | `backend_port: 8000`, `python_version: "3.11"`, `gunicorn_workers`. |
| `storage.yml` | `ansible/group_vars/` | `postgresql_version: "16"`, `pg_port: 5432`, `db_name: cosmobrief`, `db_user: cosmobrief`. |
| `cosmobrief.env.j2` | `ansible/roles/backend/templates/` | Rendered to `/opt/cosmobrief/.env` on the backend VM. Injects `DATABASE_URL`, `JWT_SECRET_KEY`, `OPENAI_API_KEY`, `SNAPI_CACHE_TTL_MINUTES` from vault and group vars. |
| `cosmobrief.service.j2` | `ansible/roles/backend/templates/` | systemd service unit. `ExecStart` calls gunicorn from the virtualenv. `EnvironmentFile` points to the rendered `.env`. |
| `gunicorn.conf.py.j2` | `ansible/roles/backend/templates/` | bind, workers, worker_class, log paths. Workers = `(ansible_processor_vcpus * 2) + 1`. |
| `nginx.conf.j2` | `ansible/roles/frontend/templates/` | Full nginx.conf (replaces default). Serves `dist/` on `{{ frontend_http_port }}`. `/api/` proxied to `http://{{ hostvars['backend']['ansible_host'] }}:{{ backend_port }}/`. `/health` returns `{"status":"ok","service":"frontend"}` inline. SPA fallback via `try_files`. |
| `env.production.j2` | `ansible/roles/frontend/templates/` | Rendered locally before the npm build. Contains only `VITE_API_URL=http://{{ ansible_host }}:{{ frontend_http_port }}/api`. The frontend's own host+port is used so the browser calls `/api/*` through nginx, which proxies to the backend. |
| `pg_hba.conf.j2` | `ansible/roles/storage/templates/` | PostgreSQL authentication. Allows `scram-sha-256` from backend IP (resolved via `hostvars`), local `peer` for postgres user, `scram-sha-256` on loopback. No IPs hardcoded. |

---

## How the Parts Relate

### Variable injection into the frontend build

The frontend needs to know the backend's address at **build time** (Vite injects `VITE_API_URL` into the JS bundle during `npm run build`). The Ansible frontend role:

1. Renders `env.production.j2` → `frontend/.env.production` **on the Ansible control node** using `template` with `delegate_to: localhost`. This template reads `{{ hostvars['backend']['ansible_host'] }}` and `{{ backend_port }}` from the inventory and group vars.
2. Runs `npm ci` and `npm run build` on the control node via `ansible.builtin.command` with `delegate_to: localhost`.
3. Copies `frontend/dist/` to the frontend VM using `ansible.builtin.copy`.

This means the backend IP is baked into the JS bundle at deploy time. This works correctly for both Vagrant (static IPs) and AWS (private IPs from the generated inventory).

### Database schema flow

1. SQLAlchemy ORM models in `backend/app/models/` define the schema in Python.
2. Migration files are written manually in `backend/alembic/versions/` using `alembic revision -m "message"` as a stub.
3. During deployment, the Ansible backend role runs `alembic upgrade head` on the backend VM (using the virtualenv's Alembic binary, connecting to the storage VM via `DATABASE_URL` from `.env`).
4. Alembic tracks applied migrations in its own `alembic_version` table in the application DB. Running `upgrade head` when no new migrations exist is a no-op.
5. The admin user is seeded in `ansible/roles/storage/tasks/seed_admin.yml`, called from play 4 (after the backend play). The `users` table is created by Alembic in play 2 (backend). Play 4 targets `hosts: storage` using `include_role tasks_from: seed_admin.yml`, so the seeding task lives in the storage role but executes after the schema exists. The task uses `ON CONFLICT DO NOTHING` and is idempotent. When `--limit storage` is used for a partial redeploy, a `failed_when` guard on `seed_admin.yml` handles the case where the users table does not yet exist, preventing a failure.

### Secret flow

1. Secrets live in `ansible/vault.yml` (encrypted).
2. Ansible decrypts them at runtime using `.vault_pass`.
3. The backend role renders `cosmobrief.env.j2` → `/opt/cosmobrief/.env` on the backend VM. Vault variables are substituted into the template at this point.
4. The systemd service loads `/opt/cosmobrief/.env` as `EnvironmentFile`. FastAPI reads all config from environment variables via `pydantic-settings` in `config.py`.
5. Secrets are never written to any other file or logged anywhere.

### Inventory and IP addresses

The Ansible inventory (`local-deploy/inventory.ini`) defines the three hosts and their IPs. All references to machine addresses in templates and playbooks use inventory variables:

```
{{ hostvars['backend']['ansible_host'] }}   # resolves to 10.10.0.20 (Vagrant) or private IP (AWS)
{{ hostvars['storage']['ansible_host'] }}   # resolves to 10.10.0.30
```

No IP address is hardcoded in any template, role, or playbook.

### Logging flow (EXTRA3)

The storage role configures rsyslog on the storage VM to listen on UDP/TCP port 514 and write received logs to `/var/log/cosmobrief-central/`. The backend and frontend roles configure rsyslog on their respective VMs to forward all application logs to the storage VM. Log entries include the originating hostname, making the source identifiable.

---

## Key Scripts and Entry Points

| Script/Command | Location | Purpose |
|---|---|---|
| `vagrant up` | `local-deploy/` | Provision the three AlmaLinux 9 VMs |
| `ansible-playbook ... ansible/playbook.yml` | repo root | Full application deployment |
| `clean_known_hosts.sh` | `local-deploy/` | Clear stale SSH keys after `vagrant destroy` |
| `nuke_all_vagrant.sh` | `local-deploy/` | Nuclear option: destroy all VMs and libvirt state |
| `provision_pe2_nat_bastion.sh` | `provisioning/` | AWS infrastructure provisioning (EXTRA4) |
| `teardown_pe2_nat_bastion.sh` | `provisioning/` | AWS teardown (EXTRA4) |
| `uvicorn app.main:app --reload` | `backend/` | Backend local dev server |
| `npm run dev` | `frontend/` | Frontend local dev server |
| `pytest` | `backend/` | Backend test suite |
| `alembic upgrade head` | `backend/` | Apply pending database migrations |
| `alembic revision -m "message"` | `backend/` | Create a new migration file stub (manual edits required) |
| `ansible-vault edit ansible/vault.yml` | repo root | Edit encrypted secrets |
