# Cosmo Brief

A personal space news companion. Articles are pulled from the [Spaceflight News API](https://api.spaceflightnewsapi.net/v4/) and move through a state machine driven by user interaction. The central feature is requesting AI-generated explanations of articles in four different tones — each explanation is stored, versioned, and rated. User history accumulates into a personal topic map. An admin role provides system-wide usage statistics.

---

## Architecture

Three-tier web application deployed across three machines.

| Machine | Address | Tier | Technology | Port |
|---|---|---|---|---|
| `frontend` | `10.10.0.10` | Frontend | React (static), nginx | 8080 (Vagrant) / 80 (AWS) |
| `backend` | `10.10.0.20` | Backend | Python 3.11, FastAPI, gunicorn + uvicorn | 8000 |
| `storage` | `10.10.0.30` | Storage | PostgreSQL 16 | 5432 |

**Communication flow:**

```
Browser → nginx (10.10.0.10:8080)
nginx proxies /api/* → FastAPI (10.10.0.20:8000)
FastAPI → PostgreSQL (10.10.0.30:5432)
FastAPI → SNAPI (external, no auth)
FastAPI → OpenAI API (external, key in vault)
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

### Local Vagrant

**Step 1 — Start the machines (one-time):**
```bash
cd local-deploy
vagrant up
```

**Step 2 — Deploy the application (from repo root):**
```bash
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass
```

This single command configures all three machines and deploys the full application. No manual steps follow.

### Redeploy a single tier

```bash
# Frontend only
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit frontend

# Backend only
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit backend

# Storage only
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit storage
```

---

## Accessing the Application

After deployment:

| Resource | URL |
|---|---|
| Application | http://10.10.0.10:8080 |
| Backend API docs | http://10.10.0.20:8000/docs |
| Frontend health | http://10.10.0.10:8080/health |
| Backend health | http://10.10.0.20:8000/health |

---

## Health Checks

**Frontend** — `GET http://10.10.0.10:8080/health`
```json
{ "status": "ok", "service": "frontend" }
```

**Backend** — `GET http://10.10.0.20:8000/health`
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
| EXTRA2 | 1 | **Role-based authorization.** Two roles: `user` and `admin`. `GET /admin/stats` is backend-enforced for admin only. Non-admin users receive HTTP 403. |
| EXTRA3 | 1 | **Central logging.** rsyslog on the storage VM collects logs from all three tiers. Log source is identifiable by hostname. Configured entirely via Ansible. |
| EXTRA4 | 3 | **AWS Academy deployment.** Same Ansible roles, separate inventory. Frontend in public subnet, backend and storage in private subnet. ProxyJump through frontend. See below and `provisioning/PE2_PROVISIONING_QUICK_START.md`. |

---

## AWS Deployment (EXTRA4)

The same `ansible/playbook.yml` and roles deploy to AWS without modification. The provisioning script generates the inventory.

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
ansible-playbook -i inventory.ini ansible/playbook.yml --vault-password-file .vault_pass -e "frontend_http_port=80"
```

The `-e "frontend_http_port=80"` overrides the Vagrant default (8080) so nginx listens on port 80 and the React build uses the correct URL.

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

Three tasks use `ansible.builtin.command` because no suitable Ansible module exists:

| Task | File | Justification |
|---|---|---|
| Disable AppStream postgresql module (`dnf -qy module disable postgresql`) | `ansible/roles/storage/tasks/main.yml` | No Ansible built-in or `community.general` module covers DNF module stream disabling on EL9. Must run before PGDG repo install to prevent AppStream from shadowing the PGDG package. `changed_when: false` — re-running is safe and idempotent. |
| PostgreSQL cluster initialisation (`postgresql-16-setup initdb`) | `ansible/roles/storage/tasks/main.yml` | No Ansible module exists for initialising a PostgreSQL data cluster on RHEL-family systems. Guarded with `creates: /var/lib/pgsql/16/data/PG_VERSION` — only runs on first deploy. |
| Database migrations (`alembic upgrade head`) | `ansible/roles/backend/tasks/main.yml` | No Ansible module exists for running Alembic schema migrations. `changed_when` is set to detect actual migration output so the task reports no change when no new migrations exist. |
| `npm ci` (install dependencies) | `ansible/roles/frontend/tasks/main.yml` | No Ansible module exists for `npm ci`. Runs on the Ansible control node via `delegate_to: localhost`. `changed_when: false` — always runs to ensure a clean install, never reports a spurious change. |
| `npm run build` (Vite production build) | `ansible/roles/frontend/tasks/main.yml` | No Ansible module exists for running npm scripts. Runs on the Ansible control node via `delegate_to: localhost`. `changed_when: false` — the resulting `dist/` files are content-hashed; the subsequent `copy` task detects actual file changes and reports them. |

**SELinux note:** The frontend role sets `httpd_can_network_connect = yes` via `ansible.posix.seboolean`. Without this, nginx (which runs in the `httpd_t` SELinux domain on AlmaLinux 9) cannot proxy to the backend and returns `502 Bad Gateway` on all API calls. This is a required idempotent step — running a second time is a no-op since the boolean is already set.

**OpenSSL/OpenSSH ABI guard:** The `generic/alma9` Vagrant box ships an `openssh-server` built against an older OpenSSL than the `openssl-libs` that gets pulled in as a transitive dependency on first deploy. Without intervention, sshd crashes mid-deploy with `OpenSSL version mismatch` and the host becomes unreachable. Two tasks in the roles prevent this:

- The storage role injects `excludepkgs=openssl*` into every `/etc/yum.repos.d/pgdg-*.repo` section right after the PGDG repo install, so PGDG can never replace the system `openssl-libs`.
- All three roles (storage, backend, frontend) run a `dnf state: latest` on `openssh` + `openssh-server` immediately after their main package install. This rebuilds sshd against whatever `openssl-libs` is now on the host. A `Restart sshd` handler is registered in each role.

If a VM was already broken by this issue before the guards were added, see `PROJECT_DOCS/TROUBLESHOOTING.md` for the recovery procedure (VNC console + `dnf upgrade openssh openssh-server`).

---

## Troubleshooting

See `PROJECT_DOCS/TROUBLESHOOTING.md` for known deployment issues and recovery steps. Most common symptom covered there: SSH `Connection refused` / `Connection reset by peer` to a VM after the first dnf transaction, caused by an OpenSSH/OpenSSL ABI mismatch on the stock `generic/alma9` box image.
