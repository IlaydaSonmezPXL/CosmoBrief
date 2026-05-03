# Phase 3 — Frontend Role + Frontend Application + EXTRA3

**Date completed:** 2026-05-01
**Scope:** Ansible frontend role, React 18 + TypeScript application, rsyslog central logging
**Status:** Complete. tsc: 0 errors, ESLint: 0 warnings, Vite build: success.

---

## What Phase 3 Covers

Everything needed to deploy the frontend tier and the centralized logging extra:

- `ansible/roles/frontend/` — full Ansible role (nginx, SELinux, npm build, EXTRA3 rsyslog client)
- `frontend/` — React 18 + TypeScript SPA (all pages, all API wrappers, auth context)
- EXTRA3 rsyslog — server config on storage VM, client forwarding on backend and frontend VMs
- `ansible/requirements.yml` updated with `ansible.posix >= 1.5.0`

---

## Files Created

### Frontend Ansible Role

| File | Purpose |
|---|---|
| `ansible/roles/frontend/defaults/main.yml` | `web_root: /var/www/cosmobrief`, `nginx_service_name: nginx` |
| `ansible/roles/frontend/handlers/main.yml` | Reload nginx, Restart nginx, Restart rsyslog |
| `ansible/roles/frontend/tasks/main.yml` | Full deploy sequence — see below |
| `ansible/roles/frontend/templates/nginx.conf.j2` | Complete nginx.conf: listen port, /health, /api/ proxy, SPA fallback |
| `ansible/roles/frontend/templates/env.production.j2` | `VITE_API_URL=http://{{ ansible_host }}:{{ frontend_http_port }}/api` |
| `ansible/roles/frontend/templates/rsyslog-client.conf.j2` | Forwards `*.*` via UDP to storage VM (EXTRA3) |

### Frontend Application

| File | Purpose |
|---|---|
| `frontend/package.json` | React 18, Vite 5, React Router v6, Axios, TypeScript, ESLint |
| `frontend/vite.config.ts` | @vitejs/plugin-react, default output to dist/ |
| `frontend/tsconfig.json` | strict mode, vite/client types, noUnusedLocals/Params |
| `frontend/index.html` | SPA entry, loads src/main.tsx as module |
| `frontend/.eslintrc.cjs` | @typescript-eslint, react-hooks, react-refresh plugins |
| `frontend/src/main.tsx` | ReactDOM.createRoot + StrictMode |
| `frontend/src/App.tsx` | BrowserRouter, Routes, PrivateRoute, AdminRoute |
| `frontend/src/context/AuthContext.tsx` | JWT in localStorage, AuthProvider, useAuth hook |
| `frontend/src/api/client.ts` | Axios instance, Bearer injection, 401 → /login redirect |
| `frontend/src/api/auth.ts` | register(), login() wrappers |
| `frontend/src/api/articles.ts` | listArticles(), getArticle(), transitionState() |
| `frontend/src/api/explanations.ts` | requestExplanation(), getExplanationHistory(), rateExplanation() |
| `frontend/src/components/Nav.tsx` | Home, Reading Map, Admin (role-conditional), Logout |
| `frontend/src/pages/Login.tsx` | Login form, error handling, redirect to / on success |
| `frontend/src/pages/Register.tsx` | Register form, error handling |
| `frontend/src/pages/Feed.tsx` | Article feed, state+freshness filters, pagination, dismissed hidden by default |
| `frontend/src/pages/ArticleDetail.tsx` | Detail view: new→read side effect, 4 mode buttons, explanation panel, ratings, version history, Save/Dismiss |
| `frontend/src/pages/ReadingMap.tsx` | Topic tag list with article counts per tag |
| `frontend/src/pages/AdminDashboard.tsx` | All admin stats fields per API contract section 7.8 |

### EXTRA3 — Central Logging (all three roles updated)

| File | Purpose |
|---|---|
| `ansible/roles/storage/templates/rsyslog-server.conf.j2` | UDP+TCP 514, per-hostname dynamic file: `/var/log/cosmobrief-central/%HOSTNAME%/%PROGRAMNAME%.log` |
| `ansible/roles/storage/tasks/main.yml` | Added: rsyslog install, log dir, server config, firewalld 514/udp+tcp, rsyslog start |
| `ansible/roles/storage/handlers/main.yml` | Added: Restart rsyslog handler |
| `ansible/roles/backend/templates/rsyslog-client.conf.j2` | `*.* @{{ hostvars['storage']['ansible_host'] }}:514` |
| `ansible/roles/backend/tasks/main.yml` | Added: rsyslog client config + enable/start |
| `ansible/roles/backend/handlers/main.yml` | Added: Restart rsyslog handler |
| `ansible/roles/frontend/templates/rsyslog-client.conf.j2` | Same pattern as backend client |
| (frontend tasks/handlers updated inline above) | — |
| `ansible/requirements.yml` | Added `ansible.posix >= 1.5.0` (for firewalld + seboolean) |

---

## Frontend Role Task Sequence

```
1.  Install nginx                                        [dnf]
2.  Template .env.production locally                     [template, delegate_to: localhost, become: false]
3.  npm ci (install dependencies)                        [command, delegate_to: localhost, changed_when: false]
4.  npm run build (Vite production build)                [command, delegate_to: localhost, changed_when: false]
5.  Ensure web root /var/www/cosmobrief exists           [file]
6.  Copy frontend/dist/ to web root                      [copy] → Restart nginx
7.  Deploy nginx.conf                                    [template] → Reload nginx
8.  Allow nginx to proxy to backend (SELinux boolean)    [ansible.posix.seboolean] httpd_can_network_connect=yes
9.  Open HTTP port in firewalld                          [ansible.posix.firewalld]
10. Enable and start nginx                               [systemd]
11. Deploy rsyslog client config (EXTRA3)                [template] → Restart rsyslog
12. Enable and start rsyslog (EXTRA3)                    [systemd]
```

---

## Key Architectural Decisions

### nginx as SPA proxy — same-origin API calls

`env.production.j2` sets `VITE_API_URL=http://{{ ansible_host }}:{{ frontend_http_port }}/api`. The browser sends API requests to the frontend's own host/port (same origin), which nginx proxies to the backend VM. This eliminates CORS concerns and hides the backend address from the browser entirely.

The alternative (VITE_API_URL pointing directly at backend) would require backend CORS to be properly configured and exposes the backend host to the browser.

### SELinux: `httpd_can_network_connect = yes`

nginx on RHEL/AlmaLinux runs in the `httpd_t` SELinux domain. By default, `httpd_t` processes cannot make outbound TCP connections. Without `httpd_can_network_connect = yes`, nginx returns `502 Bad Gateway` on every proxied request. This boolean must be set before enabling nginx. The `persistent: yes` option persists it across reboots.

### `delegate_to: localhost` build flow

Per NFR-ANS-07, the Vite build runs on the Ansible control node (not on the frontend VM). Node.js is NOT installed on the frontend VM — only nginx. The `delegate_to: localhost` sequence:
1. Renders `env.production` locally using inventory variables (so the backend IP is baked in at build time)
2. Runs `npm ci` + `npm run build` locally
3. Copies the compiled `dist/` to the VM using the built-in `copy` module

`changed_when: false` on npm tasks ensures idempotency reporting — npm always executes but never reports "changed" since the observable change is in the dist/ files (which `copy` tracks via checksums).

### Dismissed articles hidden by default (FR-FE-03)

The backend's `GET /articles` endpoint (no state filter) returns all articles including dismissed. The frontend Feed component client-side filters out `state === "dismissed"` when no explicit state filter is active. This satisfies FR-FE-03 without changing the API contract, and allows the "Dismissed" filter to explicitly show dismissed-only articles per FR-FE-04.

### TypeScript instead of JSX

The project uses TypeScript (`.tsx` / `.ts`) throughout the frontend, providing compile-time type safety. The `tsconfig.json` uses `strict: true`. The `build` script runs `tsc --noEmit` before `vite build` so type errors break the build. All API response types are defined in `api/*.ts` and used as generics in Axios calls.

### EXTRA3 — rsyslog central logging

The storage VM acts as the central syslog server (already the only always-on tier). All three VMs run rsyslog. Backend and frontend VMs forward `*.*` via UDP to `{{ hostvars['storage']['ansible_host'] }}:514`. The server config writes received logs to per-hostname, per-program files under `/var/log/cosmobrief-central/`, making the source tier identifiable.

The `stop` directive prevents forwarded logs from also appearing in the local `/var/log/messages`, keeping the central log clean and demonstrable.

Demo procedure: Request an explanation from the browser → the backend's gunicorn/uvicorn access log entry appears in `/var/log/cosmobrief-central/backend/gunicorn.log` on the storage VM.

---

## Bugs Found and Fixed During Review

| Bug | File | Fix |
|---|---|---|
| SNAPI v4 uses snake_case field names, not camelCase | `app/services/snapi_client.py` | `newsSite` → `news_site`, `imageUrl` → `image_url`, `publishedAt` → `published_at` |
| nginx could not proxy to backend (SELinux `httpd_t` domain blocks outbound TCP) | `ansible/roles/frontend/tasks/main.yml` | Added `ansible.posix.seboolean: httpd_can_network_connect: yes` |
| Dismissed articles visible in default feed (violates FR-FE-03) | `frontend/src/pages/Feed.tsx` | Client-side filter: when no stateFilter active, exclude `state === "dismissed"` |

---

## EXTRA3 Storage Role Task Additions

```
(after PG setup, before DB creation)
13. Install rsyslog                                     [dnf]
14. Create /var/log/cosmobrief-central/                 [file]
15. Deploy rsyslog-server.conf → /etc/rsyslog.d/        [template] → Restart rsyslog
16. Open port 514/udp in firewalld                      [ansible.posix.firewalld]
17. Open port 514/tcp in firewalld                      [ansible.posix.firewalld]
18. Enable and start rsyslog                            [systemd]
```

---

## EXTRA1/EXTRA2 Acceptance Conditions

Both extras were integrated as core features. Acceptance conditions met:

**EXTRA1 (JWT auth):**
- Login endpoint at `POST /auth/login` issues JWT only on successful credential check ✅
- Token stored in `localStorage`, attached to all requests via Axios interceptor ✅
- 401 interceptor clears token and redirects to `/login` ✅
- All routes except `/auth/*` and `/health` require valid JWT ✅
- Logout clears `localStorage`, redirects to `/login` ✅
- Token never hardcoded anywhere ✅

**EXTRA2 (RBAC):**
- Two roles: `user` and `admin` in `users.role` column ✅
- `GET /admin/stats` requires `role = 'admin'`, non-admin receives 403 (enforced by `require_admin` dependency in backend) ✅
- Frontend hides admin nav link for non-admin users (UX only, backend enforces) ✅
- Admin user seeded by Ansible with pre-computed bcrypt hash ✅
- Regular user receives 403 on `GET /admin/stats`; admin receives 200 ✅

---

## Before Deploying Frontend

1. `ansible-galaxy collection install -r ansible/requirements.yml` — installs both `community.postgresql` and `ansible.posix`
2. Node.js 18+ and npm must be installed on the **Ansible control node** (not on VMs)
3. Storage and backend roles must run first (plays 1 and 2)

Frontend build runs automatically on the control node. No manual npm steps on the VM.

---

## Remaining Work

- Manual browser test: full golden path (requires VMs)
- Full deploy + idempotency verification (requires VMs)
- EXTRA4: AWS deployment (separate inventory, ProxyJump through frontend)
