-- Bootstrap script run by the Postgres image on first container start.
-- Postgres mounts /docker-entrypoint-initdb.d/*.sql once when the data
-- volume is empty, so this only fires for fresh databases. Adding a new
-- statement here requires `docker compose down -v` to take effect.

CREATE EXTENSION IF NOT EXISTS vector;
