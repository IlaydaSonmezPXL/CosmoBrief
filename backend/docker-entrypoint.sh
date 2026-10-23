#!/bin/sh
set -e

# Wait for Postgres
echo "Waiting for postgres at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
until pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-cosmobrief}" >/dev/null 2>&1; do
  sleep 1
done
echo "Postgres ready."

# Run migrations
echo "Running alembic upgrade head..."
alembic upgrade head

# Seed admin + wordle words
echo "Seeding admin user + wordle words..."
python - <<'PYEOF'
import os, asyncio, bcrypt
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = os.environ["DATABASE_URL"]
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@local")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

WORDS = [
    "ORBIT","COMET","VENUS","PLUTO","TITAN","SPACE","SOLAR","PROBE","FLARE","ATLAS",
    "LASER","LUNAR","RINGS","BLACK","EARTH","VESTA","CERES","JANUS","ELARA","ARIEL",
    "STARS","MILKY","QUARK","DELTA","SIGMA","GAMMA","ALPHA","OMEGA","VIRGO","ORION",
    "DRACO","HYDRA","LUPUS","LEPUS","MUSCA","NORMA","MENSA","LIBRA","ARIES","CETUS",
    "INDUS","PYXIS","RIGEL","SPICA","DENEB","ALGOL","POLAR","MIZAR","ALCOR","DUBHE",
    "MERAK","XENON","ARGON","MAVEN","EPOCH","NADIR","APSIS","LYRID","URSID","SWIFT",
    "PHASE","TIDAL","LIGHT","RADIO","RADAR","PIXEL","OPTIC","NOVAE","LYRAE","MOONS",
    "CLOUD","DWARF","BROWN","WHITE","GIANT","SUPER","WINDS","POLES","STORM","VAPOR",
    "CRUST","MAGMA","GRAIN","AXIAL","FIELD","FORCE","HERTZ","TESLA","GAUSS","TYCHO",
    "BRAHE","EULER","FERMI","CANIS",
]

async def main():
    engine = create_async_engine(DB_URL)
    pw_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
    async with engine.begin() as conn:
        await conn.execute(
            text("""
                INSERT INTO users (user_id, username, email, password_hash, role, created_at)
                VALUES (gen_random_uuid(), :u, :e, :p, 'admin', NOW())
                ON CONFLICT DO NOTHING
            """),
            {"u": ADMIN_USERNAME, "e": ADMIN_EMAIL, "p": pw_hash},
        )
        for w in WORDS:
            await conn.execute(
                text("INSERT INTO wordle_words (word) VALUES (:w) ON CONFLICT (word) DO NOTHING"),
                {"w": w},
            )
    await engine.dispose()
    print("Seed complete.")

asyncio.run(main())
PYEOF

echo "Starting backend: $@"
exec "$@"
