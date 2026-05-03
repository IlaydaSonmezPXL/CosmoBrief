-- schema_reference.sql
-- Documentation only — NOT executed by Ansible.
-- Alembic (backend/alembic/) is the authoritative source of truth for schema.

CREATE TABLE users (
    user_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username     VARCHAR(50)  UNIQUE NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT        NOT NULL,
    role         VARCHAR(10)  NOT NULL DEFAULT 'user',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE article_cache (
    article_id   INTEGER      PRIMARY KEY,
    title        TEXT         NOT NULL,
    summary      TEXT,
    news_site    VARCHAR(255),
    url          TEXT,
    image_url    TEXT,
    published_at TIMESTAMPTZ,
    cached_at    TIMESTAMPTZ  NOT NULL
);

-- new state is implicit: absence of a row for (user_id, article_id).
CREATE TABLE article_states (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    article_id   INTEGER      NOT NULL,
    state        VARCHAR(20)  NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL,
    UNIQUE (user_id, article_id)
);

CREATE TABLE explanations (
    explanation_id  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    article_id      INTEGER     NOT NULL,
    mode            VARCHAR(20) NOT NULL,
    version         INTEGER     NOT NULL,
    text            TEXT        NOT NULL,
    generated_at    TIMESTAMPTZ NOT NULL,
    rating          VARCHAR(4),
    needs_regeneration BOOLEAN  NOT NULL DEFAULT false,
    prompt_tokens   INTEGER,
    completion_tokens INTEGER,
    UNIQUE (user_id, article_id, mode, version)
);

-- One tag per (user_id, article_id); created on first explanation for that article.
CREATE TABLE topic_tags (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    article_id   INTEGER      NOT NULL,
    tag          VARCHAR(100) NOT NULL,
    tagged_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, article_id)
);
