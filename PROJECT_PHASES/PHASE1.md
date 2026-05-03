# Phase 1 — Storage Role

**Date completed:** 2026-04-29
**Scope:** Ansible infrastructure setup + PostgreSQL storage tier
**Status:** Complete. Not yet deployed (vault unencrypted, VMs not provisioned).

---

## What Phase 1 Covers

Everything needed to configure the storage VM and make it ready for the backend's Alembic migrations:

- `.gitignore` additions
- `ansible/requirements.yml` (Ansible Galaxy collection)
- `ansible/group_vars/` — all four files
- `ansible/vault.yml` — placeholder, unencrypted
- `ansible/playbook.yml` — 4-play entry point
- `ansible/roles/storage/` — full role
- `storage/init/schema_reference.sql` — reference-only schema
- `PROJECT_DOCS/PROJECT_README.md` — corrected
- `PROJECT_DOCS/PROJECT_STRUCTURE.md` — corrected

Phase 1 does NOT include Alembic migrations, ORM models, or any backend/frontend application code. Those belong to the backend phase.

---

## Files Created

### Infrastructure

| File | Purpose |
|---|---|
| `.gitignore` | Added `.vagrant/`, `*.retry`, `.DS_Store`, `Thumbs.db` |
| `ansible/requirements.yml` | Declares `community.postgresql >= 3.0.0` collection |

### Ansible Group Variables

| File | Variables |
|---|---|
| `ansible/group_vars/all.yml` | `app_name: cosmobrief`, `backend_port: 8000`, `snapi_cache_ttl_minutes: 15` |
| `ansible/group_vars/frontend.yml` | `frontend_http_port: 8080` (overridden to `80` in AWS inventory for EXTRA4) |
| `ansible/group_vars/backend.yml` | `python_version: "3.11"`, `app_dir: /opt/cosmobrief`, `gunicorn_workers: 5` |
| `ansible/group_vars/storage.yml` | `postgresql_version: 16`, `db_name: cosmobrief`, `db_user: cosmobrief`, `pg_port: 5432` |

### Vault

| File | Notes |
|---|---|
| `ansible/vault.yml` | **UNENCRYPTED placeholder.** Must be encrypted before committing. Contains all 7 required secret keys as `CHANGEME_*` values. |

### Playbook

| File | Notes |
|---|---|
| `ansible/playbook.yml` | 4 plays: storage, backend, frontend, seed. See architectural decision below. |

### Storage Role

| File | Purpose |
|---|---|
| `ansible/roles/storage/defaults/main.yml` | Internal PG paths: `pg_data_dir`, `pg_service_name`, `pg_bin_dir`, `pg_setup_bin` |
| `ansible/roles/storage/handlers/main.yml` | `Restart PostgreSQL` (systemd restarted), `Reload PostgreSQL` (systemd reloaded) |
| `ansible/roles/storage/templates/postgresql.conf.j2` | Minimal override: `listen_addresses = '*'`, `port`, `password_encryption = scram-sha-256` |
| `ansible/roles/storage/templates/pg_hba.conf.j2` | `peer` local, `scram-sha-256` loopback + backend IP (from `hostvars`, no hardcoding) |
| `ansible/roles/storage/tasks/main.yml` | Full PG16 setup — see task sequence below |
| `ansible/roles/storage/tasks/seed_admin.yml` | Admin user seed via `ON CONFLICT DO NOTHING` |

### Role Stubs (placeholder only)

| File | Notes |
|---|---|
| `ansible/roles/backend/tasks/main.yml` | Empty stub — implemented in backend phase |
| `ansible/roles/frontend/tasks/main.yml` | Empty stub — implemented in frontend phase |

### Storage Reference

| File | Notes |
|---|---|
| `storage/init/schema_reference.sql` | Documentation only — NOT executed. All 5 tables as per REQUIREMENTS.md §8. Alembic is the source of truth. |

---

## Storage Role Task Sequence

```
1. Disable AppStream postgresql module     [command, changed_when: false]
2. Install PGDG repository RPM             [dnf]
3. Install postgresql16-server + contrib + python3-psycopg2  [dnf]
4. Initialize PostgreSQL cluster           [command, creates: PG_VERSION]
5. Enable and start postgresql-16          [systemd]
6. Deploy postgresql.conf                  [template → notify: Restart PostgreSQL]
7. Deploy pg_hba.conf                      [template → notify: Reload PostgreSQL]
8. Flush handlers                          [meta: flush_handlers]
9. Create application database             [community.postgresql.postgresql_db]
10. Create application user                [community.postgresql.postgresql_user, no_log]
11. Grant ALL on database to app user      [community.postgresql.postgresql_privs]
12. Grant ALL on public schema to app user [community.postgresql.postgresql_privs]
```

Step 12 is required because PostgreSQL 15+ revoked `CREATE` on the public schema from `PUBLIC` by default. Without this grant, Alembic cannot create tables.

---

## Architectural Decisions Made

### 4-play playbook instead of 3

The original PROJECT_STRUCTURE.md said "three plays." Seeding the admin user requires the `users` table to exist. That table is created by Alembic, which runs in the backend role (play 2). The admin seeding task (`seed_admin.yml`) lives inside the storage role but is called from a dedicated 4th play that runs after play 2:

```
Play 1: storage  → PG setup, DB, user, grants
Play 2: backend  → app code, alembic upgrade head, systemd service
Play 3: frontend → nginx, React build, static files
Play 4: storage  → admin seed (include_role tasks_from: seed_admin.yml)
```

Single-command deploy still works. All tier-specific redeploys still work. Idempotent.

### Admin seeding graceful failure on partial redeploy

When running `--limit storage` before the backend has ever deployed, play 4 runs but the `users` table does not exist. `seed_admin.yml` uses a `failed_when` guard:

```yaml
failed_when:
  - seed_result.failed
  - "'relation \"users\" does not exist' not in (seed_result.msg | default(''))"
```

This makes `--limit storage` safe at any point in the lifecycle.

### `command` module use (2 tasks, both justified)

1. `dnf -qy module disable postgresql` — No Ansible module covers DNF AppStream module disabling on EL9. Must run before PGDG install. `changed_when: false` because re-running is safe.
2. `/usr/pgsql-16/bin/postgresql-16-setup initdb` — No Ansible module exists for PGDG cluster init. Guarded by `creates: {{ pg_data_dir }}/PG_VERSION`.

Both documented in `PROJECT_DOCS/PROJECT_README.md`.

### `scram-sha-256` not `md5`

PostgreSQL 16 defaults to `scram-sha-256` for password encryption. Enforced explicitly in `postgresql.conf.j2` and in `pg_hba.conf.j2`. The original PROJECT_STRUCTURE.md table described pg_hba.conf as using "md5" — this was incorrect and has been fixed.

### `python3-psycopg2` installed on storage VM

`community.postgresql` modules require `psycopg2 >= 2.5.1` on the **managed host** (the storage VM), not the control node. Available from standard AlmaLinux 9 AppStream. Added to the package install task.

### Minimal `postgresql.conf` template

Only overrides three settings; PostgreSQL uses compiled-in defaults for everything else. This is intentional — avoids a 800-line template that would need maintenance on every PG version bump. EXTRA3 (rsyslog) will add `log_destination = 'syslog'` settings in a later phase.

---

## Corrections Made to PROJECT_DOCS

| File | What was wrong | What was fixed |
|---|---|---|
| `PROJECT_STRUCTURE.md` | Said "three plays" | Updated to "four plays" with explanation |
| `PROJECT_STRUCTURE.md` | Said admin seeding runs "before the backend role" | Corrected to describe the 4-play ordering |
| `PROJECT_STRUCTURE.md` | `pg_hba.conf.j2` described as using "md5" | Corrected to `scram-sha-256` |
| `PROJECT_STRUCTURE.md` | `all.yml` table row listed `snapi_cache_ttl_minutes` but it was missing from the actual file | Added to `group_vars/all.yml` |
| `PROJECT_README.md` | Used `ansible-galaxy collection install community.postgresql` (ad-hoc) | Changed to `ansible-galaxy collection install -r ansible/requirements.yml` |
| `PROJECT_README.md` | `command`/`shell` justification table missing `dnf module disable` entry | Added |

---

## Before Deploying

**Required steps before running the playbook:**

1. Fill in real values in `ansible/vault.yml` (replace all `CHANGEME_*` strings)
2. Pre-compute admin bcrypt hash:
   ```bash
   cd backend && python3 -m venv venv && source venv/bin/activate && pip install passlib[bcrypt]
   python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('YOUR_PASSWORD'))"
   ```
3. Encrypt the vault:
   ```bash
   ansible-vault encrypt ansible/vault.yml --vault-password-file .vault_pass
   ```
4. Install the required Ansible collection:
   ```bash
   ansible-galaxy collection install -r ansible/requirements.yml
   ```
5. Start VMs:
   ```bash
   cd local-deploy && vagrant up
   ```

**To deploy storage tier only:**
```bash
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml --vault-password-file .vault_pass --limit storage
```

Note: admin seeding (play 4) also runs when using `--limit storage`. If the backend has not yet run Alembic, the seed task gracefully skips with no failure.

---

## Phase 2 Preview

Backend phase covers:
- `backend/requirements.txt`
- `backend/alembic.ini` + `alembic/env.py` (async template)
- Alembic migrations for all 5 tables
- All ORM models, schemas, services, routers
- `ansible/roles/backend/` full role
