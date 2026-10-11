-- Makes the migration files describe the database the site actually runs on.
--
-- The live database was brought up to date outside these files (with `prisma db push`), so a database built only from the files was
-- missing columns the site needs, several indexes, and still carried the old "projects" feature. Production already has all of this, which
-- is why this file does nothing there. It exists for every other database: a new environment, CI, or rebuilding from scratch.
--
-- It can never remove data. Every statement either adds something only if it is missing, or removes something only if it is empty:
--   * columns and indexes are added with IF NOT EXISTS,
--   * an old enum value is only taken away when no row anywhere uses it,
--   * the old "projects" tables and column are only dropped when they hold no rows (or no values),
--   * and anything that does hold data is left exactly as it is, with a notice saying so.
-- Run twice, or run on a database that is already correct, it changes nothing.

-- 1. What the live database has that the files never created ---------------------------------------------------------------------

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "githubTokenCiphertext" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "githubTokenUpdatedAt" TIMESTAMP(3);
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "sourceKey" TEXT;
ALTER TABLE "github_stats" ADD COLUMN IF NOT EXISTS "contributionCalendar" JSONB;

-- 2. The enums: the files created the old, larger ones ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Role' AND e.enumlabel IN ('MODERATOR', 'MEMBER', 'VOLUNTEER')
  ) THEN
    IF EXISTS (SELECT 1 FROM "users" WHERE "role"::text IN ('MODERATOR', 'MEMBER', 'VOLUNTEER')) THEN
      RAISE NOTICE 'Role: some people still have an old role, so the enum is left as it is.';
    ELSE
      CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'MAINTAINER');
      ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
      ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
      ALTER TYPE "Role" RENAME TO "Role_old";
      ALTER TYPE "Role_new" RENAME TO "Role";
      DROP TYPE "Role_old";
    END IF;
  END IF;
END
$$;

-- Only the default, which is metadata: no row is touched.
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MAINTAINER';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ActivityType' AND e.enumlabel IN ('PROJECT_JOIN', 'PROJECT_CREATE', 'PROJECT_PROPOSAL', 'PROJECT_APPROVED', 'PROJECT_REJECTED')
  ) THEN
    IF EXISTS (
      SELECT 1 FROM "activities"
      WHERE "type"::text IN ('PROJECT_JOIN', 'PROJECT_CREATE', 'PROJECT_PROPOSAL', 'PROJECT_APPROVED', 'PROJECT_REJECTED')
    ) THEN
      RAISE NOTICE 'ActivityType: some activity still has an old project type, so the enum is left as it is.';
    ELSE
      CREATE TYPE "ActivityType_new" AS ENUM (
        'COMMIT', 'PULL_REQUEST', 'ISSUE', 'EVENT_JOIN', 'EVENT_CREATE', 'MEMBER_JOIN', 'EVENT_PROPOSAL', 'EVENT_APPROVED',
        'EVENT_REJECTED', 'LEETCODE_EASY', 'LEETCODE_MEDIUM', 'LEETCODE_HARD'
      );
      ALTER TABLE "activities" ALTER COLUMN "type" TYPE "ActivityType_new" USING ("type"::text::"ActivityType_new");
      ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
      ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
      DROP TYPE "ActivityType_old";
    END IF;
  END IF;
END
$$;

-- 3. The old "projects" feature, which the site no longer has ------------------------------------------------------------------------
-- Nothing here is dropped unless it is empty.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'projectId'
  ) THEN
    IF EXISTS (SELECT 1 FROM "activities" WHERE "projectId" IS NOT NULL) THEN
      RAISE NOTICE 'activities.projectId still holds values, so it is kept.';
    ELSE
      ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_projectId_fkey";
      ALTER TABLE "activities" DROP COLUMN "projectId";
    END IF;
  END IF;

  IF to_regclass('public.project_members') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM "project_members") THEN
      RAISE NOTICE 'project_members holds rows, so it is kept.';
    ELSE
      DROP TABLE "project_members";
    END IF;
  END IF;

  IF to_regclass('public.projects') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM "projects") THEN
      RAISE NOTICE 'projects holds rows, so it is kept.';
    ELSE
      BEGIN
        DROP TABLE "projects";
      EXCEPTION WHEN dependent_objects_still_exist THEN
        RAISE NOTICE 'projects is still referenced by something that holds data, so it is kept.';
      END;
    END IF;
  END IF;

  BEGIN
    DROP TYPE IF EXISTS "ProjectStatus";
  EXCEPTION WHEN dependent_objects_still_exist THEN
    RAISE NOTICE 'ProjectStatus is still in use, so it is kept.';
  END;
END
$$;

-- 4. Indexes the live database has ----------------------------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "users_githubUsername_key" ON "users"("githubUsername");
CREATE INDEX IF NOT EXISTS "users_role_joinedAt_idx" ON "users"("role", "joinedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "activities_sourceKey_key" ON "activities"("sourceKey");
CREATE INDEX IF NOT EXISTS "activities_createdAt_id_idx" ON "activities"("createdAt", "id");
CREATE INDEX IF NOT EXISTS "activities_type_createdAt_idx" ON "activities"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "event_attendees_eventId_joinedAt_idx" ON "event_attendees"("eventId", "joinedAt");
CREATE INDEX IF NOT EXISTS "events_approvalStatus_date_idx" ON "events"("approvalStatus", "date");
CREATE INDEX IF NOT EXISTS "events_creatorId_createdAt_idx" ON "events"("creatorId", "createdAt");
CREATE INDEX IF NOT EXISTS "github_stats_contributions_idx" ON "github_stats"("contributions");
CREATE INDEX IF NOT EXISTS "github_stats_commits_idx" ON "github_stats"("commits");
CREATE INDEX IF NOT EXISTS "leetcode_stats_totalSolved_idx" ON "leetcode_stats"("totalSolved");
