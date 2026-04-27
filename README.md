[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/01hPPfqp)
# Automation I - PE2 - 3-tier Web Application with Ansible

![pe2](pe2.png)

## Context

In this assignment, you will build and deploy a non-trivial 3-tier web application on three local Vagrant-managed machines.

The focus of this assignment is not cloud engineering. The purpose is learning to code and deploy using software engineering techniques and agentic coding, as well as apply configuration management with Ansible.

The default assignment environment is provided in the `local-deploy/` directory and uses Vagrant to create the required virtual machines. An AWS Academy deployment is available only as an extra.

After the machines are created, deployment and configuration of the full application must be done with Ansible.

---

## Assignment specification

Format:
- Individual assignment
- Infrastructure: 3 machines
- Repository structure: required monorepo containing the full project
- Deployment technology: Ansible
- Core provisioning: local Vagrant environment in `local-deploy/`
- Optional AWS extra provisioning: documented reproducible workflow, with starter scripts in `provisioning/`

### What you must build

You must build a real 3-tier web application consisting of:

- a frontend tier
- a backend tier
- a storage tier

> Each tier must run on its own machine.

The three tiers must communicate correctly with each other:
- The frontend must communicate with the backend
- the backend must communicate with the storage tier

Your application must be non-trivial. This means all of the following:

- it must persist state
- the frontend must call the backend through an API
- the backend must contain real application logic beyond plain CRUD
- the storage tier must contain a real persistence component
- the application must support at least one meaningful workflow involving multiple steps, rules, or state changes
  - Simple create-read-update-delete flows alone do not count as a meaningful workflow.
  - A meaningful workflow example: a reservation system where items can be reserved, confirmed, cancelled, or expired, with state transitions and business rules enforced by the backend.

Accepted storage technologies include for example:

- PostgreSQL, MySQL, MariaDB, ...
- MongoDB, Redis, ...

Not accepted:

- SQLite
- file-backed persistence only
- a fake storage layer that is present but not meaningfully used

### Forbidden project types

The following are not acceptable:

- plain note app
- simple CRUD catalog with no meaningful workflow
- static frontend with fake API
- monolithic app presented as if it were 3-tier
- trivial clone of a todo list in another theme

### Technical constraints

The application must run on 3 machines.

The provided Vagrant setup is the default core environment.

Configuration management and application deployment must be done with Ansible.

For the AWS deployment extra, the scripts in `provisioning/` are a starting point.

Any AWS provisioning workflow must be documented, reproducible, and committed to the repository.

The project must be submitted as a single monorepo containing the frontend code, backend code, storage-related code or database setup if applicable, and the Ansible deployment code.

The Ansible deployment code must be part of the same monorepo and must not be submitted as a separate repository.

### Core local environment

The basic requirements are evaluated against the local Vagrant environment in `local-deploy/`.

The local environment provides:

- `frontend` at `10.10.0.10`
- `backend` at `10.10.0.20`
- `storage` at `10.10.0.30`

Each application part must run on its dedicated VM:

- the frontend service must run on the `frontend` VM
- the backend service must run on the `backend` VM
- the storage service or database must run on the `storage` VM

The Vagrant machines are only the infrastructure target. They must not replace the required Ansible deployment. After the machines exist, the full application must still be configured and deployed through Ansible.

The AWS provisioning guide is `provisioning/PE2_PROVISIONING_QUICK_START.md`. It is relevant only for the AWS deployment extra.

### Deployment requirements

You must be able to deploy the full application with **one Ansible command**.

- That command must configure all required machines and make the application usable.
- Manual post-installation steps are not allowed.

Allowed preparation before running the deployment command:

- placing your SSH key in the expected location if required by the provided provisioning workflow
- installing required tools on your own local machine, such as Vagrant, the required Vagrant provider, and Ansible
- preparing local Ansible configuration files that are part of your repository
- populating your Ansible group variables or host variables with values from the selected inventory

Not allowed after provisioning:

- manually editing `.env` files, application config files, or service config files on the target machines
- manually copying application files to the target machines
- manually installing missing dependencies on the target machines
- manually starting, stopping, or restarting services on the target machines
- manually fixing ports, hostnames, IP addresses, database connection strings, or secrets on the target machines

If a value is required for deployment, it must be handled through Ansible variables, templates, or other automated Ansible mechanisms.

The provisioning step may require limited one-time local preparation on your own machine, for example installing Vagrant plugins or selecting the SSH key used by the local VMs. This local preparation is not part of the Ansible deployment grade.

Once provisioning has finished, configuration and deployment of the application on the target machines must be done through Ansible only.

### Ansible expectations

Your Ansible solution must show all of the following:

- clear role separation
- parameterized configuration: configuration files deployed to target machines must use Jinja2 templates populated from Ansible variables, not static files with hardcoded values
- sensible variable usage:
  - no hardcoded IP addresses in playbooks or templates
  - tier-wide settings defined in `group_vars`
  - host-specific settings in `host_vars`
  - no duplicate variable definitions across the same scope
- idempotent deployment: running the playbook a second time against an already-deployed system must produce no changes and must not restart services that have not changed
- tier-specific structure: organize your playbook with separate plays targeting distinct inventory groups (`frontend`, `backend`, `storage`) so that a single tier can be redeployed without affecting the others
- health verification after deployment
- secrets such as database passwords, API signing keys, and service credentials must not be hardcoded in playbooks, templates, or committed variable files
  - use Ansible Vault or equivalent parameterization to handle sensitive values
- Use `command` or `shell` modules only if no suitable Ansible module exists, and justify such use in the `PROJECT_README.md`.

You are expected to organize your Ansible code clearly and professionally.

> **AWS extra ProxyJump warning:**
> - The backend and storage machines are in the private subnet and are reachable through Ansible only via the frontend machine as a jump host.
> - Ensure your frontend role does not reconfigure or restart `sshd` in a way that drops this connectivity.
> - This warning applies to the AWS deployment extra. Test any SSH-related frontend changes carefully before running a full redeploy on AWS.

---

## Demo

During the demo, you must show all of the following.

### Architecture explanation

Briefly explain:

- which machine hosts the frontend
- which machine hosts the backend
- which machine hosts the storage tier
- how the tiers communicate

### Full deployment

Start from a state where the machines are provisioned but no application has been deployed yet.

Show and run the single Ansible command used to deploy the application.

### Health checks for every tier

You must demonstrate a meaningful health check for every tier:

- frontend health
- backend health
- storage tier health

These checks must verify real behavior and must not be limited to checking whether a process is running.

Minimum expectations:

- frontend:
  - must expose a dedicated health endpoint
  - must return HTTP 2xx with a non-empty response body confirming the service is operational
- backend:
  - must expose a dedicated health endpoint
  - must return HTTP 2xx with a structured response body (for example JSON) confirming the service is operational - the body must include at least a status indicator, not just an empty 200
- storage tier:
  - health must be demonstrated through a real interaction with the storage technology being used, such as a read, write, query, publish, consume, or equivalent operation
  - the interaction must produce an observable result - confirming that a process is running is not sufficient
  - the demonstration must be clearly visible during the demo, for example as terminal output, a backend health endpoint response that includes storage connectivity status, or an Ansible post-deployment verification task

The frontend and backend health endpoints must be part of the deployed application and must be reachable during the demo.

A superficial "the process is running" check alone is not enough.

### Persisted-state proof

You must demonstrate that user data is really stored in the storage tier.

Your demo must show that data entered through the application is stored in the storage tier and remains present and accessible after a full Ansible redeploy. Redeploying the application must not wipe or reset user data.

### Tier-specific redeploy

You must demonstrate a targeted change and redeploy of one tier only.

Examples:

- change backend configuration and redeploy only backend
- change frontend configuration and redeploy only frontend

This must not require redeploying the full stack.

The change must produce an observable difference that confirms it took effect on the target tier.

### Live redeploy

You must run the full deployment command a second time against the **already-running** system and show that it completes cleanly.

This is distinct from the full deployment shown earlier which proved the deployment works from a clean state.

This redeployment proves idempotency: running it again against a live system must produce no changes and must not restart services that have not changed.

The rerun must complete without errors. Services must still be running, all data entered before the rerun must still be present and accessible, and no configuration must have been silently altered.

---

## Submission requirements

You must submit:

- your monorepo containing the full project
- the Ansible deployment code inside the same monorepo
- a `PROJECT_README.md` (see requirements below)
- a `PROJECT_STRUCTURE.md` (see requirements below)

### PROJECT_README.md

Your `PROJECT_README.md` must contain at least:

- project title
- short description of the application
- architecture overview
- which machine hosts which tier
- deployment command
- any prerequisites
- how to access the application
- which extras are implemented

Keep it concise and technical.

`PROJECT_README.md` is the short entry document. Detailed explanation of the monorepo structure, commands, and technical workflows belongs in `PROJECT_STRUCTURE.md`.

### PROJECT_STRUCTURE.md

Your `PROJECT_STRUCTURE.md` must explain the technical organization of your monorepo.

It must contain at least:

- a short directory tree or folder overview of the monorepo
- where the frontend code is located
- where the backend code is located
- where the storage-related code, schema, seed data, or database setup is located, if applicable
- where the Ansible playbooks, roles, inventory, group variables, and host variables are located
- the exact commands used to build the project, if applicable
- the exact commands used to test the project, if applicable
- the exact commands used to run the project locally during development, if applicable
- the exact command used to deploy the project in the local Vagrant assignment setup
- if the AWS deployment extra is implemented, the exact commands used to provision, deploy, verify, and tear down the AWS setup
- which important scripts, entry points, helper commands, or task-runner commands are used
- which important configuration files, templates, variables, or environment files exist
- for each important command, from which directory it must be executed
- how the different parts of the monorepo relate to each other

This document must be technical, clear, and detailed enough that another student can understand how the monorepo is organized and how the main workflows are executed.

---

## Grading

### Scoring structure

- basic requirements: 14/20
- extras: 6/20

A missing core requirement caps the maximum score.

A smaller but correct, reproducible, and well-automated system will score better than a larger but fragile one.

### Gated core requirements

If a gated core requirement is missing, the maximum score is capped even if extras are implemented.

The core requirements are:

- The core application must run on 3 machines
- non-trivial application with meaningful workflow
  - Simple CRUD flows alone do not count as a meaningful workflow.
- real persistence and meaningful storage-tier use
- one-command Ansible deployment with no manual post-installation steps
- role separation and parameterized configuration
- idempotent deployment: a rerun against an already-deployed system produces no changes and does not restart services that have not changed
- meaningful health checks for frontend, backend, and storage
- persisted-state proof
- tier-specific redeploy
- no secrets hardcoded in committed files
- successful deployment to the local Vagrant assignment environment

---

## Extras

Extras are optional:

- They improve your score only after the core requirements are satisfied.
- Only fully implemented and clearly demonstrated extras count.

### EXTRA1 (1 POINT) - Token-based authentication

This extra counts only if it is used correctly and is meaningfully integrated into the application.

Minimum acceptance conditions:

- the token must not be hardcoded in the frontend or backend source code
- there is a real login endpoint
- credentials are checked against a persistent user store, not against values hardcoded in source code or configuration files
- a token is issued only after successful authentication
- at least one backend route is protected by token validation
- unauthorized requests to a protected route are rejected correctly
- the frontend actually uses the token in a real authenticated flow
- at least one meaningful application action is available only to authenticated users
- logging out or removing the token from the client prevents further access to protected functionality through the application; client-side token removal is sufficient, server-side token blacklisting is not required

### EXTRA2 (1 POINT) - Role-based authorization

This extra counts only if authorization is actually enforced and is meaningfully integrated into the application.

This extra can be implemented independently of EXTRA1. Any authentication mechanism is acceptable as long as role enforcement itself meets the conditions below.

Minimum acceptance conditions:

- at least two distinct roles exist
- roles are assigned through application data or a real user store
- authorization is enforced in the backend, not only hidden in the frontend
- at least one meaningful action or route is allowed for one role and denied for another
- the difference in access is clearly demonstrated with users from different roles
- a user without the required role receives a correct denial response
- changing the visible frontend alone is not sufficient
- the protected action or route must be part of the real application workflow, not a dummy endpoint added only for this extra

### EXTRA3 (1 POINT) - Simple central logging

A lightweight solution such as a central syslog service or a small log aggregation tool is sufficient. The logging component must run on one of the existing three machines.

The emphasis is on correctness and integration, not on the complexity of the logging technology.

Minimum acceptance conditions:

- logs from the frontend, backend, and storage tier are forwarded or collected in one central location
  - the source of each collected log entry must be identifiable by machine or tier
- the central logging component can show logs originating from distinct machines or tiers
- the collected logs must include application or service logs that are relevant to the deployed system
- the central logging setup must be part of the Ansible deployment
- during the demo, you must show that a new event from one tier appears in the central logging output

### EXTRA4 (3 POINTS) - AWS Academy deployment

This extra counts only if the same application that works in the local Vagrant environment is also deployed correctly on AWS Academy infrastructure.

Minimum acceptance conditions:

- AWS infrastructure provisioning is automated, documented, reproducible, and committed to the repository
- the provided Bash and AWS CLI scripts in `provisioning/` may be used as the starting point
- the AWS workflow is documented using `provisioning/PE2_PROVISIONING_QUICK_START.md`, updated if your provisioning workflow differs from the starter scripts
- the AWS setup uses three machines: frontend, backend, and storage
- backend and storage machines are not exposed publicly unless a justified application requirement needs it
- the same Ansible roles and playbooks are used for both local Vagrant deployment and AWS deployment
  - inventory-specific variables are allowed
  - duplicating a separate AWS-only deployment is not sufficient
- after AWS provisioning, the full application is deployed with one Ansible command and no manual post-installation steps
- no AWS-generated IP addresses, hostnames, credentials, or secrets are hardcoded in playbooks, templates, or committed variable files
- the AWS demo shows the same required evidence as the core demo: health checks, persisted-state proof, tier-specific redeploy, and live redeploy
- teardown is documented and works through the provided teardown script so AWS resources are not left running
