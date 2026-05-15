# Cosmo Brief

A personal space news companion with a full editorial magazine interface. Articles are pulled from the [Spaceflight News API](https://api.spaceflightnewsapi.net/v4/) and move through a state machine driven by user interaction. The core feature is requesting AI-generated explanations of articles in four tones — each is stored, versioned, and rated. Reading history accumulates into a personal topic constellation. An admin role provides system-wide usage statistics. Every screen uses the shared `Cosmo·Brief` editorial chrome (masthead, brand bar, sticky tab nav, footer).

---

## Architecture

Three-tier web application deployed across three machines.

| Machine | Address | Tier | Technology | Port |
|---|---|---|---|---|
| `frontend` | public IP (AWS) | Frontend | React (static), nginx | 80 |
| `backend` | private IP (AWS) | Backend | Python 3.11, FastAPI, gunicorn + uvicorn | 8000 |
| `storage` | private IP (AWS) | Storage | PostgreSQL 16 | 5432 |

**Communication flow:**

```
Browser → nginx (frontend:80)
nginx proxies /api/* → FastAPI (backend:8000)
FastAPI → PostgreSQL (storage:5432)
FastAPI → SNAPI (external, no auth)
FastAPI → OpenAI API (external, key in vault)
FastAPI → AstronomyAPI (external, key in vault)
```

The frontend is a compiled React application served as static files. nginx proxies `/api/` requests to the backend. The frontend never contacts the storage tier or external APIs directly.

---

## Prerequisites

Install on your local machine before running the deployment command:

- **Vagrant** with the `vagrant-libvirt` provider
- **KVM / libvirt** (required by the Vagrantfile provider)
- **Ansible** ≥ 2.14
- **Python 3.11+** on your local machine (for Ansible)
- **Node.js 18+** and **npm** on your local machine (Vite build runs locally via `delegate_to: localhost`)
- **ansible-galaxy collections:**
  ```bash
  ansible-galaxy collection install -r ansible/requirements.yml
  ```
- A **vault password file** at `.vault_pass` in the repo root (see Secrets below)

---

## Secrets

All secrets are stored in `ansible/vault.yml`, encrypted with Ansible Vault. The vault password must be placed in `.vault_pass` at the repo root before deploying. This file is git-ignored and must never be committed.

Secrets managed in vault:

| Variable | Description |
|---|---|
| `vault_db_password` | PostgreSQL application user password |
| `vault_db_admin_password` | PostgreSQL postgres superuser password |
| `vault_jwt_secret_key` | JWT signing secret (≥32 chars) |
| `vault_openai_api_key` | OpenAI API key |
| `vault_astronomy_app_id` | AstronomyAPI application ID (Astronomical Events widget) |
| `vault_astronomy_app_secret` | AstronomyAPI application secret (Astronomical Events widget) |
| `vault_admin_username` | Admin account username |
| `vault_admin_email` | Admin account email |
| `vault_admin_password_hash` | Pre-computed bcrypt hash of admin password |

To edit secrets:
```bash
ansible-vault edit ansible/vault.yml --vault-password-file .vault_pass
```

To pre-compute the admin bcrypt hash (one-time setup):
```bash
cd backend && python3 -m venv venv && source venv/bin/activate && pip install passlib[bcrypt]
python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('YOUR_PASSWORD'))"
```

---

## Deployment

### AWS (primary)

After provisioning (see AWS Deployment section below), deploy with one command from repo root:

```bash
ansible-playbook -i inventory.ini ansible/playbook.yml --vault-password-file .vault_pass
```

This single command configures all three machines and deploys the full application. No manual steps follow.

### Redeploy a single tier (AWS)

```bash
# Frontend only
ansible-playbook -i inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit frontend

# Backend only
ansible-playbook -i inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit backend

# Storage only
ansible-playbook -i inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit storage
```

### Vagrant (testing only)

```bash
cd local-deploy && vagrant up
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass -e "frontend_http_port=8080"
```

---

## Accessing the Application

After AWS deployment (replace `<FRONTEND_IP>` with the public IP from `inventory.ini`):

| Resource | URL |
|---|---|
| Application | http://\<FRONTEND_IP\> |
| Backend API docs | http://\<FRONTEND_IP\>/api/docs |
| Frontend health | http://\<FRONTEND_IP\>/health |
| Backend health | http://\<FRONTEND_IP\>/api/health |

```bash
FRONTEND_IP=$(grep '^frontend ' inventory.ini | grep -oP 'ansible_host=\K[^ ]+')
```

---

## Health Checks

**Frontend** — `GET http://<FRONTEND_IP>/health`
```json
{ "status": "ok", "service": "frontend" }
```

**Backend** — `GET http://<FRONTEND_IP>/api/health`
```json
{
  "status": "ok",
  "db_status": "connected",
  "db_response": "SELECT 1 returned 1 row",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

Storage health is verified through the backend health endpoint, which executes a real `SELECT 1` query against PostgreSQL and reports the result in `db_status`.

---

## Extras Implemented

| Extra | Points | Description |
|---|---|---|
| EXTRA1 | 1 | **Token-based authentication.** JWT issued on login, verified on all protected routes. Credentials stored in PostgreSQL, never hardcoded. |
| EXTRA2 | 1 | **Role-based authorization.** Two roles: `user` and `admin`. `POST /articles/:id/explanations` (AI generation), `GET /admin/stats`, and `GET /admin/users` are backend-enforced for admin only. Non-admin users receive HTTP 403. The frontend hides the AI Briefing section entirely for non-admin users. |
| EXTRA3 | 1 | **Central logging.** rsyslog on the storage VM collects logs from all three tiers. Log source is identifiable by hostname. Configured entirely via Ansible. |
| EXTRA4 | 3 | **AWS Academy deployment.** Same Ansible roles, separate inventory. Frontend in public subnet, backend and storage in private subnet. ProxyJump through frontend. See below and `provisioning/PE2_PROVISIONING_QUICK_START.md`. |

---

## Additional Features (beyond core spec)

| Feature | Description |
|---|---|
| V3 Editorial UI | All screens share `Cosmo·Brief` editorial chrome (masthead, brand bar, tab nav, footer) via `EditorialShell.tsx`. Topic facets in Browse via `GET /articles/topics`. |
| Space Wordle | Daily Cipher at `/wordle` — 5-letter space words from PostgreSQL, daily rotation, per-user localStorage state, stats panel. |
| Astronomical Events | Widget on Home/Browse — tonight's planets (AstronomyAPI) + upcoming meteor showers/eclipses (curated). Google Calendar links per event. |
| User Account | `PATCH /users/me` — update username/email/password. `DELETE /users/me/data` — wipe reading history. 4-theme accent system. |
| Article Search | `GET /articles?q=` — full-text ILIKE search on title and summary. |

---

## AWS Deployment (EXTRA4)

The same `ansible/playbook.yml` and roles deploy to AWS without modification. The provisioning script generates the inventory.

**Amazon Linux 2023 compatibility:** The EC2 instances provisioned by `provision_pe2_nat_bastion.sh` run Amazon Linux 2023. All three Ansible roles contain `when: ansible_distribution != "Amazon"` guards on tasks that do not apply to Amazon Linux (PGDG repo install, AppStream module disable, firewalld, openssl resync). On Amazon Linux, PostgreSQL 16 is installed from the native Amazon repos. The roles detect the distribution automatically — no manual changes are needed between Vagrant (AlmaLinux 9) and AWS (Amazon Linux 2023).

**Prerequisites:** AWS CLI configured, SSH key pair, `ansible-galaxy collection install -r ansible/requirements.yml`.

**Step 1 — Provision** (run from repo root):

```bash
chmod +x provisioning/provision_pe2_nat_bastion.sh provisioning/teardown_pe2_nat_bastion.sh
./provisioning/provision_pe2_nat_bastion.sh
```

Generates `inventory.ini` (with ProxyJump for private hosts), `ansible.cfg`, `provisioned_vars.yml`, `pe2_state.env` at repo root — all git-ignored.

**Step 2 — Verify connectivity:**

```bash
ansible all -m ping
```

**Step 3 — Deploy** (run from repo root):

```bash
ansible-playbook -i inventory.ini ansible/playbook.yml --vault-password-file .vault_pass
```

`frontend_http_port: 80` is the group_vars default (AWS target), so no extra variable override is needed.

**Step 4 — Health check:**

```bash
FRONTEND_IP=$(grep '^frontend ' inventory.ini | grep -oP 'ansible_host=\K[^ ]+')
curl http://${FRONTEND_IP}/health
curl http://${FRONTEND_IP}/api/health
```

**Step 5 — Tear down** (run from repo root):

```bash
./provisioning/teardown_pe2_nat_bastion.sh
```

---

## Ansible `command`/`shell` Module Justifications

The following tasks use `ansible.builtin.command` or `ansible.builtin.shell` because no suitable Ansible module exists:

| Task | File | Justification |
|---|---|---|
| Disable AppStream postgresql module (`dnf -qy module disable postgresql`) | `ansible/roles/storage/tasks/main.yml` | No Ansible built-in or `community.general` module covers DNF module stream disabling on EL9. Must run before PGDG repo install to prevent AppStream from shadowing the PGDG package. `changed_when: false` — re-running is safe and idempotent. |
| PostgreSQL cluster initialisation (`postgresql-16-setup initdb`) | `ansible/roles/storage/tasks/main.yml` | No Ansible module exists for initialising a PostgreSQL data cluster on RHEL-family systems. Guarded with `creates: /var/lib/pgsql/16/data/PG_VERSION` — only runs on first deploy. |
| Database migrations (`alembic upgrade head`) | `ansible/roles/backend/tasks/main.yml` | No Ansible module exists for running Alembic schema migrations. `changed_when` is set to detect actual migration output so the task reports no change when no new migrations exist. |
| Backend source archive (`tar czf /tmp/cosmobrief-backend.tar.gz`) | `ansible/roles/backend/tasks/main.yml` | No built-in Ansible module creates a tar archive from a local directory while excluding multiple subdirectories by glob (venv, pycache, pyc, .pytest_cache, .mypy_cache). The `community.general.archive` module would require an additional Galaxy collection not otherwise needed. Runs on the Ansible control node via `delegate_to: localhost`. `changed_when: false` — the archive is recreated on every run but change detection is delegated to the subsequent `copy` task, which compares checksums against the remote copy. Only if the archive content changed (source code modified) will `copy` report changed, and only if extracted files differ will `unarchive` notify the service restart handler. |
| `npm ci` (install dependencies) | `ansible/roles/frontend/tasks/main.yml` | No Ansible module exists for `npm ci`. Runs on the Ansible control node via `delegate_to: localhost`. `changed_when: false` — always runs to ensure a clean install, never reports a spurious change. |
| `npm run build` (Vite production build) | `ansible/roles/frontend/tasks/main.yml` | No Ansible module exists for running npm scripts. Runs on the Ansible control node via `delegate_to: localhost`. `changed_when: false` — the resulting `dist/` files are content-hashed; the subsequent `copy` task detects actual file changes and reports them. |
| Exclude openssl from PGDG repos (shell loop over `/etc/yum.repos.d/pgdg-*.repo`) | `ansible/roles/storage/tasks/main.yml` | No Ansible module can conditionally append a `dnf.conf` key to a set of repo files matched by glob. A shell `for` loop with `grep`/`sed` is the only option. `changed_when: false` — re-running is safe: the `grep` guard ensures the line is added at most once. |

**SELinux note (AlmaLinux 9 / Vagrant only):** The frontend role sets `httpd_can_network_connect = yes` via `ansible.posix.seboolean`. Without this, nginx (which runs in the `httpd_t` SELinux domain on AlmaLinux 9) cannot proxy to the backend and returns `502 Bad Gateway`. This task is guarded with `when: ansible_distribution != "Amazon"` — it does not run on AWS (Amazon Linux 2023 does not enforce this SELinux policy for nginx). Idempotent on re-run.

**OpenSSL/OpenSSH ABI guard (AlmaLinux 9 / Vagrant only):** The `generic/alma9` Vagrant box ships `openssh-server` built against an older OpenSSL ABI than what the PGDG repo pulls in as a dependency. Without intervention, sshd crashes mid-deploy with `OpenSSL version mismatch`. All three roles contain two guards:

- Storage role: injects `excludepkgs=openssl*` into every PGDG repo file so PGDG never replaces system `openssl-libs`.
- All roles: run `dnf state: latest` on `openssh` + `openssh-server` after their main package install to resync sshd with the current `openssl-libs`.

Both guards are conditioned `when: ansible_distribution != "Amazon"` and do not run on AWS.

---

## Troubleshooting

See `PROJECT_DOCS/TROUBLESHOOTING.md` for known deployment issues. The OpenSSL/OpenSSH ABI issue only affects AlmaLinux 9 (Vagrant). AWS (Amazon Linux 2023) is not affected.
