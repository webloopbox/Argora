-- Bootstrap script run by the Postgres image on first container start.
-- Postgres mounts /docker-entrypoint-initdb.d/*.sql once when the data
-- volume is empty, so this only fires for fresh databases. Adding a new
-- statement here requires `docker compose down -v` to take effect.

CREATE EXTENSION IF NOT EXISTS vector;

-- Partial unique index to enforce "one pending invitation per (group, invitee)"
-- at the DB level. We can't express this through TypeORM's @Unique because
-- it must be conditional on status='pending' (closed/declined invitations
-- may exist alongside a new pending one). Created idempotently here so the
-- index is in place from first migration.
CREATE UNIQUE INDEX IF NOT EXISTS group_invitations_one_pending_per_pair
  ON group_invitations (group_id, invitee_id)
  WHERE status = 'pending' AND archived_on IS NULL;

-- Partial unique index for "one active vote per (argument, user)". Retracted
-- votes set archived_on, so a user can have multiple historical rows but
-- only one active row per argument at any given moment.
CREATE UNIQUE INDEX IF NOT EXISTS votes_one_active_per_pair
  ON votes (argument_id, user_id)
  WHERE archived_on IS NULL;
