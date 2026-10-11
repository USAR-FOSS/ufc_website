-- A narrow, read only window onto "who is a member of the club", for the OIDC sign in service (the separate `OIDC` repository), which
-- reads it to put `member` and `role` in people's ID tokens.
--
-- This is a contract between the two systems, so it only ever grows: columns may be added, but never renamed or removed, because the other
-- service reads them by name. It deliberately leaves out everything private (the stored GitHub tokens, email addresses, bios).
--
-- Nobody can read it until a login is granted SELECT on it. That is done by hand, once, with the SQL in the OIDC repository's
-- docs/main-db-view.sql (it creates a login that can read this view and nothing else).

CREATE OR REPLACE VIEW oidc_members_v AS
SELECT
  u."githubId"  AS github_id,
  u."id"        AS user_id,
  u."role"::text AS role,
  u."joinedAt"  AS joined_at
FROM users u
WHERE u."githubId" IS NOT NULL;

REVOKE ALL ON oidc_members_v FROM PUBLIC;
