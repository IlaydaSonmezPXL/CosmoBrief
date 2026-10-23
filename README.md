# Cosmo Brief

A personal space news companion with an editorial magazine interface. Articles are pulled from the [Spaceflight News API](https://api.spaceflightnewsapi.net/v4/) and move through a state machine driven by user interaction. Users can request AI-generated explanations of articles in four tones — each is stored, versioned, and rated. Reading history builds into a personal topic map, and there's a daily space-themed word game. An admin role provides system-wide usage statistics.

## Architecture

```
Browser → frontend (nginx, :8080)
            ├─ serves the React build
            └─ proxies /api/* → backend (FastAPI, :8000) → db (PostgreSQL 16)
                                   ├─ Spaceflight News API
                                   ├─ OpenAI API
                                   └─ AstronomyAPI
```

| Service    | Directory   | Stack                                  |
|------------|-------------|----------------------------------------|
| `frontend` | `frontend/` | React 18, TypeScript, Vite, nginx      |
| `backend`  | `backend/`  | Python 3.11, FastAPI, SQLAlchemy, Alembic |
| `db`       | —           | `postgres:16-alpine`, data in the `db_data` volume |

Only the frontend port is published; the backend and database are reachable only inside the compose network.

## Running

Requires Docker with the Compose plugin.

```bash
cp .env.example .env    # fill in the values
docker compose up --build
```

Open http://localhost:8080 and log in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`.

On every start the backend waits for Postgres, runs `alembic upgrade head`, and seeds the admin user and word list (idempotent — existing data is left alone).

### Configuration

All settings live in `.env` (see `.env.example`):

| Variable | Required | Purpose |
|---|---|---|
| `POSTGRES_PASSWORD` | yes | Database password |
| `JWT_SECRET_KEY` | yes | JWT signing key — `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | yes | Password for the seeded admin account |
| `POSTGRES_DB`, `POSTGRES_USER` | no | Default `cosmobrief` |
| `ADMIN_USERNAME`, `ADMIN_EMAIL` | no | Default `admin` / `admin@local` |
| `OPENAI_API_KEY` | no | Needed for AI explanations |
| `ASTRONOMY_APP_ID`, `ASTRONOMY_APP_SECRET` | no | Needed for planet positions |

### Useful commands

```bash
docker compose logs -f backend      # follow backend logs
docker compose down                 # stop (keeps data)
docker compose down -v              # stop and delete the database volume
curl localhost:8080/health          # frontend health
curl localhost:8080/api/health      # backend + database health
```

## Development

Run the tests and type checks from `backend/` and `frontend/`:

```bash
cd backend && pip install -r requirements.txt && pytest && mypy app/
cd frontend && npm ci && npx tsc --noEmit && npm run lint
```
