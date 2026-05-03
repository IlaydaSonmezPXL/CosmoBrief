# Troubleshooting

Known issues encountered during deployment and how to resolve them.

---

## SSH connection fails to a freshly-provisioned VM

### Symptoms

One of the following on `ansible -m ping` or during the playbook run:

- `Connection refused` on port 22
- `Connection reset by peer` during `kex_exchange_identification`
- `wait_for_connection` timing out after the storage role has run

ICMP (`ping`) to the VM works, the VM is `running` in `vagrant status`, but TCP 22 is unreachable or actively rejecting.

### Root cause

The `generic/alma9` Vagrant box (4.3.12) ships with `openssh-server-8.7p1-34.el9` built against an older OpenSSL ABI. The first dnf transaction the playbook runs (storage role installs the PGDG repo and PostgreSQL 16; backend role installs Python; frontend role installs nginx) pulls a newer `openssl-libs` as a transitive dependency. The installed `sshd` binary is now linked against an OpenSSL version it was not built for and crashes on every start with:

```
sshd[NNN]: OpenSSL version mismatch. Built against 30000070, you have <newer>
sshd.service: Main process exited, code=exited, status=255/EXCEPTION
sshd.service: Failed with result 'exit-code'.
```

`systemctl status sshd` shows `activating (auto-restart) (Result: exit-code)`, repeating every ~40 seconds. SSH is dead until the package set is realigned.

### Detection from outside the VM

```bash
# Network is fine, port is not
ping -c2 <vm_ip>
ssh -o ConnectTimeout=5 vagrant@<vm_ip> hostname   # Connection refused / reset

# Vagrant itself cannot reach the box either
vagrant ssh storage   # hangs or returns nothing
```

### Fix on a broken VM

`vagrant ssh` does not work, so log in via the QEMU/libvirt console.

1. Find the VNC display:
   ```bash
   sudo virsh vncdisplay local-deploy_storage
   # → 127.0.0.1:N   (port = 5900 + N)
   ```
2. Connect (install `tigervnc-viewer` or `virt-viewer` if needed):
   ```bash
   vncviewer 127.0.0.1:590N
   # or:
   remote-viewer vnc://127.0.0.1:590N
   ```
3. Log in as `vagrant` / `vagrant` and run:
   ```bash
   sudo dnf upgrade -y openssh openssh-server
   sudo systemctl restart sshd
   sudo systemctl status sshd --no-pager
   ```
4. Verify from the host:
   ```bash
   ansible -i local-deploy/inventory.ini <host> -m ping
   ```

If `dnf upgrade` reports "Nothing to do", try:

```bash
sudo dnf install -y --allowerasing openssh openssh-server
sudo systemctl restart sshd
```

If the version mismatch persists in the other direction (sshd built against newer OpenSSL than what is installed), downgrade `openssl-libs` to match:

```bash
rpm -q openssl-libs
sudo dnf list openssl-libs --showduplicates | tail
sudo dnf downgrade -y openssl-libs
sudo systemctl restart sshd
```

### Permanent prevention (already in the playbook)

The roles include guards that prevent this from happening on a fresh deploy:

| Role | Task | Effect |
|---|---|---|
| `storage` | `Exclude openssl packages from PGDG repos` | Adds `excludepkgs=openssl*` to every `/etc/yum.repos.d/pgdg-*.repo` section. Stops PGDG from ever shipping a replacement `openssl-libs`. |
| `storage`, `backend`, `frontend` | `Keep openssh in sync with current openssl-libs` | `dnf state: latest` on `openssh` and `openssh-server` after the role's main package install, so the sshd binary is always rebuilt against whatever `openssl-libs` is now on the host. Notifies a `Restart sshd` handler. |

If you destroy and recreate the VMs and run the playbook again on the current code, the issue does not recur.

---

## Frontend returns 502 Bad Gateway on `/api/*`

### Symptoms

`curl http://10.10.0.10:8080/health` returns `200`. `curl http://10.10.0.10:8080/api/auth/login` returns `502 Bad Gateway`. Backend itself is healthy:

```bash
ansible -i local-deploy/inventory.ini backend -m shell -a "curl -s http://127.0.0.1:8000/health" -b
# {"status":"ok","db_status":"connected",...}
```

But from the frontend VM:
```bash
ansible -i local-deploy/inventory.ini frontend -m shell -a "curl -v http://10.10.0.20:8000/health" -b
# connect to 10.10.0.20 port 8000 failed: No route to host
```

### Root cause

The backend's `firewalld` blocks inbound TCP 8000. Default AlmaLinux 9 zone allows only ssh + cockpit. The backend role was missing the port-open task.

### Fix

The backend role now includes:

```yaml
- name: Open backend API port in firewalld
  ansible.posix.firewalld:
    port: "{{ backend_port }}/tcp"
    permanent: true
    state: enabled
    immediate: true
```

If the role still has the old version, re-run `ansible-playbook --limit backend`. The task is idempotent.

---

## Login returns 500 / "Internal Server Error"

### Symptoms

`POST /api/auth/login` returns 500. Frontend shows "Invalid username or password" because the Axios interceptor falls back to a generic message. Backend log shows:

```
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])
  File ".../passlib/handlers/bcrypt.py", line 380, in detect_wrap_bug
    if verify(secret, bug_hash):
```

### Root cause

`passlib` 1.7.x runs a one-time `detect_wrap_bug()` probe on first `bcrypt.verify()` call. The probe uses an over-72-byte test secret. `bcrypt` 4.x stopped silently truncating and now raises `ValueError`. passlib has not been updated to handle the new behavior. Result: the very first password verification crashes the worker.

### Fix

Pin `bcrypt<4.0` in `backend/requirements.txt`:

```
passlib[bcrypt]>=1.7.4
bcrypt<4.0
```

Re-run the backend role — Ansible's `pip` task reinstalls the venv with the pin, the systemd handler restarts gunicorn, login starts working.

Long-term: switch `auth_service.py` from `passlib` to direct `bcrypt` (`bcrypt.hashpw` / `bcrypt.checkpw`) and drop the passlib dependency.

---

## "Found both group and host with same name" warnings

Cosmetic only. The inventory defines hosts named `frontend`, `backend`, `storage` inside groups of the same names. Ansible warns but treats both correctly. Safe to ignore.

To silence: rename the hosts (e.g. `storage-1`) in `local-deploy/inventory.ini` while keeping the group names.

---

## Explanations return 500 "Failed to generate explanation"

### Symptoms

`POST /articles/{id}/explanations` returns 500. Frontend shows "Failed to generate explanation." Backend error log:

```
sqlalchemy.exc.InvalidRequestError: A transaction is already begun on this Session.
```

### Root cause

`get_or_generate_explanation` in `explanation_service.py` used `async with session.begin()` to wrap all DB operations. The router calls `await db.get(ArticleCache, article_id)` before invoking the service — this autobegins a transaction on the session. When the service then tries `session.begin()`, SQLAlchemy raises `InvalidRequestError` because a transaction is already open.

### Fix — `backend/app/services/explanation_service.py`

Remove `async with session.begin():` and replace with a plain code block. Add `await session.commit()` before the final `return`:

```python
# Before (broken):
async with session.begin():
    result = await session.execute(...)
    ...
    session.add(new_explanation)
    # implicit commit on context exit
return new_explanation, "generated"

# After (fixed):
result = await session.execute(...)
...
session.add(new_explanation)
await session.commit()
return new_explanation, "generated"
```

The existing autobegin transaction (started by the router's `db.get()`) covers all the service's queries and the final commit.

### Deploying the OpenAI API key

The key lives in `ansible/vault.yml` as `vault_openai_api_key`. After updating the vault, push it to the server:

```bash
ansible-playbook -i local-deploy/inventory.ini ansible/playbook.yml \
  --vault-password-file .vault_pass --limit backend
```

This regenerates `/opt/cosmobrief/.env` from the template and restarts the service via the handler.

---

## Articles endpoint returns 503 "SNAPI unavailable and cache empty"

### Symptoms

`GET /articles` (authenticated) returns:

```json
{"error": "snapi_unavailable", "message": "SNAPI unavailable and cache empty."}
```

`GET /health` returns `200` with `db_status: connected`. SNAPI is reachable from the host machine.

### Root causes (three separate bugs)

#### 1. SNAPI rate-limiting — fetch loop had no page cap

`fetch_snapi_articles()` looped through all ~340 pages (33,976 articles) on every cold-start cache refresh. SNAPI returned `429 Too Many Requests` around page 89, which was caught as `httpx.HTTPError` and re-raised as `SnapiUnavailable`. With an empty cache, `ensure_cache_fresh` then raised `SnapiUnavailable` to the caller, producing the 503.

**Fix — `backend/app/services/snapi_client.py`:**

```python
SNAPI_MAX_PAGES = 5  # 500 articles is sufficient for fresh/aging coverage

# In fetch_snapi_articles: stop after SNAPI_MAX_PAGES pages
while url and pages_fetched < SNAPI_MAX_PAGES:
    ...
    pages_fetched += 1
```

Also: on a 429 response, break with partial results instead of failing:

```python
if response.status_code == 429:
    logger.warning("SNAPI rate-limited after %d pages; using partial results", pages_fetched)
    break
response.raise_for_status()
```

This means any successfully-fetched articles are cached rather than discarded.

#### 2. Naive datetime rejected by asyncpg — `parse_published_at` not timezone-safe

`parse_published_at` used `.replace("Z", "+00:00")` then `datetime.fromisoformat()`. For any SNAPI article whose `published_at` string has no timezone suffix (no `Z`, no `+HH:MM`), `fromisoformat` returns a **naive** `datetime`. asyncpg rejected naive datetimes for `TIMESTAMP WITH TIME ZONE` columns with:

```
asyncpg.exceptions.DataError: invalid input for query argument $7:
  datetime.datetime(...) (can't subtract offset-naive and offset-aware datetimes)
```

**Fix — `backend/app/services/snapi_client.py`:**

```python
def parse_published_at(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None
```

#### 3. ORM models missing `DateTime(timezone=True)` — SQLAlchemy generated wrong cast

`ArticleCache.published_at` and `ArticleCache.cached_at` were declared as `Mapped[datetime]` with no explicit column type. SQLAlchemy inferred `TIMESTAMP WITHOUT TIME ZONE`, so the INSERT statement used `$N::TIMESTAMP WITHOUT TIME ZONE` casts — incompatible with the timezone-aware datetimes being inserted and the `TIMESTAMP WITH TIME ZONE` columns in the migration.

**Fix — `backend/app/models/article_cache.py`, `article_state.py`, `explanation.py`:**

```python
from sqlalchemy import DateTime, ...

published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
cached_at:    Mapped[datetime]         = mapped_column(DateTime(timezone=True), nullable=False)
# same pattern for updated_at and generated_at in other models
```

### Verification

```bash
TOKEN=$(curl -s -X POST http://10.10.0.20:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<pw>"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl -s "http://10.10.0.20:8000/articles?limit=5" -H "Authorization: Bearer $TOKEN"
# Expected: {"total": N, "articles": [...], ...}  where N > 0
```

---

## Quick triage checklist for SSH issues

Run from the host:

```bash
cd local-deploy
vagrant status
ping -c2 <vm_ip>
ssh -i ~/.vagrant.d/insecure_private_key -o StrictHostKeyChecking=no vagrant@<vm_ip> hostname
ansible -i inventory.ini <host> -m ping
```

| Step that first fails | Likely cause |
|---|---|
| `vagrant status` not `running` | VM halted — `vagrant up <host>` |
| `ping` fails | libvirt private network down — `virsh net-list`, `vagrant reload <host>` |
| `ssh` refused/reset | sshd dead on the VM — see "SSH connection fails" above |
| `ansible ping` fails but raw ssh works | inventory or `ansible_user`/key mismatch |
