# The site shows errors, or is very slow, and it may be the database

_Last checked: not yet. Whoever follows this for the first time, fix anything that was wrong and put the date here._

## First, work out what is actually wrong (5 minutes)

1. Open the Neon status page and the Neon console. Is there an incident, and does the project show as running?
2. From a laptop with a `.env` for the **development** database, check the production database with its address given on the command line
   (it only reads):
   ```bash
   npm run db:ping -- "postgresql://…production direct address…"
   ```
3. Read what it says:

| You see                                                   | It means                                                                | Do this                                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `connected` in a second or two, then rows                 | The database is fine. The problem is elsewhere (Vercel, Redis, GitHub). | Look at the Vercel deployment logs and [redis-down.md](redis-down.md).                                 |
| Connects, but only after 5 to 15 seconds the first time   | It was asleep and woke up. Normal.                                      | Nothing. If it happens all day, check how busy it is (below).                                          |
| `too many connections` or `remaining connection slots`    | Too many instances opened connections.                                  | Check `DATABASE_URL` has `-pooler` in its host. Redeploy.                                              |
| `timeout` or cannot connect, and Neon reports an incident | Neon is down.                                                           | Wait, and tell members. If it goes past an hour, use [failover-to-standby.md](failover-to-standby.md). |
| Neon says the project is suspended or at a limit          | Compute or storage capacity reached.                                    | See "Out of capacity" below.                                                                           |
| Project missing or tables missing                         | Data loss.                                                              | Stop. Do not run anything. Go to [restore-database.md](restore-database.md).                           |

## Out of capacity

A Neon project has limits on compute and storage. When one is reached the database stops until it resets or the limit is raised.

1. In Neon, open **Usage** and note the number and the reset date.
2. Make sure the maximum size is capped at 0.25 CU (Compute settings), so a burst cannot scale it beyond what this site needs.
3. Check the live poll is idling: `LIVE_POLL_IDLE_HOURS` should not be `0`, and the schedule should be `*/5` (`npm run jobs:schedule -- --list`).
4. If it has already run out and the site must stay up, use [failover-to-standby.md](failover-to-standby.md): the standby is a separate
   project with its own limits.

## Do not

- Do not run `prisma migrate reset`, `prisma db push --force-reset`, or the seed script against production, ever. They are blocked on
  purpose when `PRODUCTION_DB_HOST` is set.
- Do not delete and recreate the Neon project to "fix" it. You will lose the point-in-time history that might be the thing that saves you.
