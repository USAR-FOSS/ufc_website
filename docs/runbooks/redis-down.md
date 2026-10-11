# Redis (Upstash) is down or refusing commands

_Last checked: not yet._

Redis only holds things that can be rebuilt (cached lists, the live poll's notes, short locks), and the site is built to keep working
without it: reads go to the database, the rate limiter lets requests through, and the poll skips a beat. So this is "slower", not "down".

## What you will notice

- The leaderboard and members lists are slower (each request goes to the database). This is the main risk: more database work means more
  more load on it.
- Dashboards stop updating live.
- `Upstash` errors in the Vercel logs: `max requests limit exceeded`, `daily request limit`, or timeouts.

## Steps

1. Upstash console, the database, **Usage**. Out of commands or bandwidth, or a real outage?
2. **Refusing commands** (Upstash says a limit was reached):
   - Create another database (in your Upstash account, or another officer's), and set it as the **state** database
     (`UPSTASH_REDIS_STATE_REST_URL` and `_TOKEN`) or as an extra cache database (`UPSTASH_REDIS_CACHE_2_REST_URL` and `_TOKEN`). Redeploy.
     That moves a share of the traffic to it. See `docs/data-protection.md` for which is which.
   - Or raise `CACHE_L1_SECONDS` (default 5) to 15 to take more reads off Redis, at the cost of data that is up to 15 seconds old.
3. **A real outage:** wait. Do not change code. Check the Upstash status page.
4. **Emergency, if Redis is making the site fail rather than just slow:** remove the `UPSTASH_REDIS_*` variables in Vercel and redeploy.
   The site runs without Redis (per-instance caching and limits). Put them back afterwards.

## Do not

- Do not clear all of Redis "to fix it". It is not needed and it makes every instance reload everything at once.
