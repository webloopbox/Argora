-- Bootstrap script run by the Postgres image on first container start.
-- Postgres mounts /docker-entrypoint-initdb.d/*.sql once when the data
-- volume is empty, so this only fires for fresh databases. Adding a new
-- statement here requires `docker compose down -v` to take effect.
--
-- Only statements that need no tables belong here. The volume is empty when
-- this file runs, and TypeORM creates the tables later, on the first API boot,
-- so anything referencing a table fails silently at this point. The two
-- partial unique indexes this file used to declare were lost exactly that way;
-- they are now declared on the Vote and GroupInvitation entities as partial
-- unique @Index definitions, which `synchronize` creates and keeps.

CREATE EXTENSION IF NOT EXISTS vector;
