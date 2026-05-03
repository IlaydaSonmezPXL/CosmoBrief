# Phase 4 — EXTRA4: AWS Academy Deployment

**Date completed:** 2026-05-01
**Scope:** AWS deployment documentation and command corrections
**Status:** Complete. Same roles deploy to AWS using generated inventory + extra var.

---

## What Phase 4 Covers

EXTRA4 requires deploying the same Ansible roles to AWS Academy EC2 instances. No new Ansible code was written — the roles already satisfy all requirements:

- No hardcoded IP addresses anywhere (all use `hostvars` lookups)
- `ansible/vault.yml` holds all secrets
- All config via Jinja2 templates
- Idempotent tasks throughout

The work in this phase was:
- Correcting the AWS deployment commands in PROJECT_STRUCTURE.md and PROJECT_README.md (wrong working directory, missing `-e "frontend_http_port=80"`)
- Adding a full AWS deployment section to PROJECT_README.md
- Creating this phase document

---

## AWS Architecture

| VM | Subnet | Ansible access |
|---|---|---|
| frontend | public (has public IP) | direct SSH |
| backend | private (no public IP) | ProxyJump through frontend |
| storage | private (no public IP) | ProxyJump through frontend |

The provisioning script (`provisioning/provision_pe2_nat_bastion.sh`) generates `inventory.ini` at the repo root with the ProxyJump configuration baked in. Ansible uses this to reach the private-subnet hosts transparently.

---

## Port Difference: Vagrant vs AWS

| Environment | Port | How set |
|---|---|---|
| Vagrant | 8080 | `ansible/group_vars/frontend.yml` default |
| AWS | 80 | `-e "frontend_http_port=80"` extra variable (highest precedence) |

Using an extra variable avoids modifying committed files between environments and requires no separate group_vars file per environment.

---

## How the Roles Work for AWS

### IP address resolution

All inter-VM references use `{{ hostvars['<host>']['ansible_host'] }}`:

- `pg_hba.conf.j2`: allows connections from `{{ hostvars['backend']['ansible_host'] }}` (private IP on AWS)
- `nginx.conf.j2`: proxies `/api/` to `http://{{ hostvars['backend']['ansible_host'] }}:{{ backend_port }}/`
- `rsyslog-client.conf.j2`: forwards logs to `{{ hostvars['storage']['ansible_host'] }}`

On AWS these resolve to private IPs within the VPC, which is correct — the frontend nginx talks to the backend over the private network.

### VITE_API_URL on AWS

`env.production.j2` renders:
```
VITE_API_URL=http://{{ ansible_host }}:{{ frontend_http_port }}/api
```

On AWS, `ansible_host` is the frontend's **public IP** and `frontend_http_port` is `80` (from the extra var). The browser loads the app from the public IP and sends API requests to `http://<public-ip>:80/api`, which nginx serves on port 80. The `:80` is redundant but valid.

nginx then proxies `/api/` to the backend's **private IP** within the VPC. The browser never sees the backend address.

### SELinux

`httpd_can_network_connect = yes` is required on AlmaLinux 9 EC2 instances for the same reason as Vagrant — nginx runs in the `httpd_t` domain and cannot proxy by default.

### Secrets

`ansible/vault.yml` is used identically for both environments. The vault password (`.vault_pass`) must exist at the repo root before deploying.

---

## Deployment Commands (canonical)

All commands run from the **repo root**.

```bash
# 1. Make scripts executable (one-time)
chmod +x provisioning/provision_pe2_nat_bastion.sh provisioning/teardown_pe2_nat_bastion.sh

# 2. Provision AWS infrastructure
./provisioning/provision_pe2_nat_bastion.sh

# 3. Verify Ansible connectivity
ansible all -m ping

# 4. Deploy the full application
ansible-playbook -i inventory.ini ansible/playbook.yml --vault-password-file .vault_pass -e "frontend_http_port=80"

# 5. Health check
FRONTEND_IP=$(grep '^frontend ' inventory.ini | grep -oP 'ansible_host=\K[^ ]+')
curl http://${FRONTEND_IP}/health
curl http://${FRONTEND_IP}/api/health

# 6. Tear down when done
./provisioning/teardown_pe2_nat_bastion.sh
```

---

## Files Modified in Phase 4

| File | Change |
|---|---|
| `PROJECT_DOCS/PROJECT_STRUCTURE.md` | Fixed provisioning working directory (repo root, not provisioning/); added `-e "frontend_http_port=80"` to deploy command; added connectivity check step; fixed teardown command |
| `PROJECT_DOCS/PROJECT_README.md` | Added full AWS Deployment section with all steps; updated EXTRA4 table entry |
| `PROJECT_DOCS/TODO.md` | Marked EXTRA4 complete |
| `PROJECT_DOCS/DONE.md` | Added EXTRA4 completion entry |

---

## Remaining Verification (requires running VMs)

- Full deploy from clean state on AWS
- Idempotency (second run: zero changed)
- Health checks on all three tiers
- Data durability across redeploy
