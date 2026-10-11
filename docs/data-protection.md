# Keeping the data safe and the site standing

What was built, and the one-time work on accounts that goes with it. The code is already in place and does nothing new until the settings
below exist, so you can do these in any order, but the order here is the one that removes the most risk first.

For emergencies, see [runbooks/](runbooks/README.md).

## The idea in one paragraph

Postgres is the only place where the club's data is the truth. Everything else (Redis, caches, the live poll's notes) is a copy that can be
rebuilt. So the work is: keep Postgres from falling over when a thousand people arrive, make sure a copy of it exists somewhere Neon cannot
delete, and make a bad command or a leaked secret unable to destroy it.

## What changed in the code

| Where                                    | What                                                                                                                                                                                                                        | Why                                                                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/server/db/prisma.ts`                | Small connection pool per instance, idle connections released, warning when the direct Neon address is used in production, optional read replica (`prismaRead`)                                                             | A thousand people means many server instances, and each one opening up to 10 connections is how a database runs out of them |
| `prisma.config.ts`, `prisma/db-guard.ts` | `DIRECT_URL` for migrations, and Prisma commands and the seed script refuse to touch the production host from a laptop                                                                                                      | The most likely way to lose everything is a local command run against production                                            |
| `src/server/features/live/*`             | The scheduled poll does nothing (one Redis read) after 3 hours with nobody on the site. It loads only member ids first, and full rows only for the members who are due.                                                     | The poll used to keep the database busy all day and read everyone every run, and it silently stopped at 500 members         |
| `src/server/cache/*`                     | A few seconds of in-memory cache per instance, one database call for a crowd asking the same thing, cache namespaces spread over several Redis databases, working memory (the poll's notes, locks) separated from the cache | Every Redis command is a network round trip, and the same few answers are asked for by everyone at once                     |
| `src/app/api/stream/dashboard/route.ts`  | Version check every 10 s instead of 5, and one write per server for everyone watching instead of one per viewer                                                                                                             | These were the two things that grew with the number of viewers                                                              |
| `leaderboard`, `stats` routes            | Load only the columns they show                                                                                                                                                                                             | Each member's row holds a whole year's contribution calendar, and the leaderboard loaded all of them                        |
| `ops/`                                   | The SQL for restricted logins, and the backup job to put in its own repository                                                                                                                                              | See below                                                                                                                   |
| `scripts/db-ping.mts`                    | `npm run db:ping` checks any database and says what the login can do                                                                                                                                                        | To check each step below worked                                                                                             |

## New settings

| Variable                                    | Where                                     | What                                                                                 |
| ------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`                              | Vercel                                    | Now the **pooled** address (host has `-pooler`), with the restricted `ufc_app` login |
| `DIRECT_URL`                                | your machine, and wherever migrations run | The **direct** address with the owner login. Only Prisma commands use it.            |
| `PRODUCTION_DB_HOST`                        | your machine only                         | Host name of the production database. Turns on the guard.                            |
| `DATABASE_REPLICA_URL`                      | Vercel, optional                          | A read replica. Leave unset until you create one.                                    |
| `DATABASE_POOL_MAX`                         | Vercel, optional                          | Connections per instance, default 5                                                  |
| `UPSTASH_REDIS_STATE_REST_URL` / `_TOKEN`   | Vercel, optional                          | A second Redis database for the poll's notes, locks and the sign-in-again list       |
| `UPSTASH_REDIS_CACHE_2_REST_URL` / `_TOKEN` | Vercel, optional                          | A third, for part of the cache. Up to `CACHE_6`.                                     |
| `CACHE_L1_SECONDS`                          | Vercel, optional                          | Seconds an instance may hold an answer in memory. Default 5.                         |
| `LIVE_POLL_IDLE_HOURS`                      | Vercel, optional                          | Quiet hours before the scheduled poll pauses. Default 3, `0` turns it off.           |

The poll schedule changed from every 2 minutes to every 5. While anyone has a dashboard open their server polls every minute by itself, so
the people looking see no difference. Run `npm run jobs:schedule` after deploying to apply it.

## Do these, in this order

### 1. Neon: pooled address, direct address, compute size (15 minutes)

1. Neon console, your project, **Connect**. Note there are two addresses: with **Pooled connection** on, the host contains `-pooler`.
2. In Vercel, set `DATABASE_URL` to the **pooled** one. Keep what you have as `DIRECT_URL` on your machine (`.env`).
3. In Neon, **Compute**, set the autoscaling **maximum to 0.25 CU** (plenty for this site). Leave **scale to zero** on.
4. Redeploy. Check `npm run db:ping` prints `pooled`.

### 2. Neon: restricted logins and a development branch (30 minutes)

1. Open `ops/sql/roles.sql`, replace the two passwords, and run it in the Neon **SQL Editor** while connected as the owner (the
   `neondb_owner` login or whichever you use for migrations). Save both passwords in the password manager.
2. Build two addresses from your direct and pooled hosts: `ufc_app` with the pooled host (for Vercel `DATABASE_URL`) and `ufc_backup` with the
   direct host (for the backup job).
3. Check, with `npm run db:ping -- "<ufc_app address>"`: it must say the login **cannot drop or empty the tables**.
4. Put the `ufc_app` pooled address into Vercel as `DATABASE_URL`, and redeploy. The owner login now only lives on your machine, in
   `DIRECT_URL`, for migrations.
5. Make a **development branch** in Neon (Branches, create from the main one) and use **its** address in your local `.env` for
   `DATABASE_URL` and `DIRECT_URL`. Add `PRODUCTION_DB_HOST` with the production host. Everyone who runs the site locally does the same.
6. Run the pending migration for GitHub token renewal, once, deliberately:
   ```bash
   DIRECT_URL="<production direct owner address>" ALLOW_PRODUCTION_DB=yes npx prisma migrate deploy
   ```
   (`ALLOW_PRODUCTION_DB=yes` is the guard's "I mean it". Do not leave it in `.env`.)

### 3. Backups to somewhere Neon cannot delete (1 hour)

1. Choose the officer who will own the backups. It should **not** be the person who owns the website repository or the Neon account.
2. They create a new **private** GitHub repository, for example `ufc-db-backups`, and copy the contents of `ops/backup-repo/` into it
   (including the `.github` folder).
3. On their machine, make the key pair: `age-keygen -o ufc-backup-key.txt` (on Ubuntu `sudo apt install age`). The line starting
   `Public key: age1…` is the public key. The file is the private key.
4. Put `ufc-backup-key.txt` in the password manager so **two** officers can reach it, and print one copy for the club's records. It never
   goes into GitHub.
5. In that repository, add the secrets in the table in its README (`BACKUP_DATABASE_URL` with the `ufc_backup` direct address, and
   `AGE_PUBLIC_KEY`).
6. **Actions, Database backup, Run workflow.** It must go green. If the step "Back up, prove it restores, encrypt" fails, read its log: it
   says which table did not match, or what could not connect.
7. Do the first [restore drill](runbooks/restore-drill.md) the same week.

### 4. A second copy that can take over (1 hour)

Pick a second place for a spare database that is **not** Neon account A. In order of simplicity:

- **A second Neon account** owned by another officer, a project with a database. Same tools, same console.
- **Supabase** project. If the backup job cannot connect to it, use its **Session pooler** address (the plain one is IPv6 only and
  GitHub's runners do not use IPv6).

Check the provider's current terms, and that the spare will not be paused for being quiet (the 6 hourly refresh counts as activity,
which is another reason it is scheduled that often).

1. Create the project and database, and note its **direct** address and owner login.
2. In the backup repository add it as the secret `STANDBY_1_URL`. A third place goes in `STANDBY_2_URL`.
3. Run the workflow again. The last step "Refresh the standby copies" should say refreshed.
4. Check it: `npm run db:ping -- "<standby address>"`. The row counts should match production.
5. Print or save [failover-to-standby.md](runbooks/failover-to-standby.md) with the standby's address, and make sure the person who would do
   it knows where the password manager entry is.

### 5. Redis: spread the load (20 minutes)

To spread the load over more databases:

1. **State database.** In Upstash, create another Redis database (in your account or another officer's). In Vercel set
   `UPSTASH_REDIS_STATE_REST_URL` and `UPSTASH_REDIS_STATE_REST_TOKEN`. The live poll's notes, locks and the sign-in-again list move there.
   They no longer share a database with the cache.
2. **A second cache database**, if the main one is still busy: another database, and set
   `UPSTASH_REDIS_CACHE_2_REST_URL` and `_TOKEN`. Part of the cache (the leaderboard and dashboard lists) moves to it. Add `CACHE_3`… the same way.
3. Redeploy. Open the dashboard and, in each Upstash console, watch the **Commands** graph move.

Things to know: the in-memory cache (`CACHE_L1_SECONDS`) and the slower version check are already in the code and take most of the load.
And nothing in Redis is precious: losing a database costs a few slow minutes, never data.

### 6. Make the schedule match, and check (10 minutes)

1. After the deploy: `npm run jobs:schedule` (it updates the existing schedules in place), then `npm run jobs:schedule -- --list` and check
   `live-poll` says `*/5 * * * *`.
2. Leave the site alone for 3 hours. In Neon, **Monitoring**, the compute should go to idle and then to sleep, and in QStash the poll
   messages should show as `skipped: nobody has been on the site lately`.
3. Open a dashboard. Within about a minute the compute wakes and the data refreshes.

### 7. The read replica (optional, only if Neon shows load)

Neon console, **Compute**, **Add Read Replica**, maximum 0.25 CU, scale to zero on. Set its address as `DATABASE_REPLICA_URL` and redeploy.
Only the live poll's lists of who to check use it, and that is on purpose: anything that feeds a cache or follows a write must read from
the primary, or a lagging replica would put an old answer in front of everyone. It is a second compute that runs on its own, so watch **Monitoring** for
a day after adding it and remove it if it turns out to add nothing.

## Things nobody can recover for you

Keep these in the password manager. They are not in the database, so a restored database is not enough without them.

- `TOKEN_ENCRYPTION_KEY` (without it every stored GitHub connection is unreadable and members sign in again)
- `NEXTAUTH_SECRET`
- `GITHUB_ID`, `GITHUB_SECRET`
- The backup key (`ufc-backup-key.txt`), the owner, `ufc_app` and `ufc_backup` passwords, and each standby's address
- Upstash and QStash tokens, and the QStash signing keys

## What this does not protect against

- Someone with the owner password. Keep it off Vercel and off laptops that are not needed for migrations.
- Everything done in the last 6 hours before a total loss. That is the trade-off of a copy taken every 6 hours. Neon's own history covers recent mistakes much more
  finely than the backups do; the backups cover the day Neon itself is the problem.
- A bug that deletes rows with the site's own login. The restricted login stops structure changes, not `DELETE`. The point-in-time history
  and the backups are the answer to that, which is what the runbook is for.
