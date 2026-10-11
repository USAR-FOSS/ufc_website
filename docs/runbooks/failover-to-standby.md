# Run the site from the standby database

_Last checked: not yet. Fix anything that was wrong when you follow it, and put the date here._

Use this when the production database is unreachable for more than about an hour (a Neon outage, an account problem, or the project's limits reached), or when it is gone and restoring a backup into a new database would take longer.

**What you give up.** The standby is refreshed from a backup every 6 hours, so it can be up to 6 hours behind. Things done in that window
(a sign up, an event, a registration) are missing and have to be done again. Everything GitHub and LeetCode related fills itself back in.

## Before you start

- The standby's direct address (password manager: "UFC standby").
- Access to the Vercel project (environment variables, redeploy).
- Someone to check the result with you.

## Steps

1. **Claim the standby so the backup job stops overwriting it.** On the standby, as its owner login:
   ```sql
   create table public._standby_promoted (promoted_at timestamptz not null default now());
   insert into public._standby_promoted default values;
   ```
   From now on the refresh job skips it (that is what `refresh-standby.sh` looks for).
2. **Look at it.** `npm run db:ping -- "<standby direct address>"`. Row counts should be plausible, and this should show recent people:
   ```sql
   select max("lastActive") from users;
   ```
3. **Give it the restricted login.** Run `ops/sql/roles.sql` on the standby (as its owner), with new passwords.
4. **Point the site at it.** In Vercel, **Settings, Environment Variables, Production**:
   - `DATABASE_URL`: the standby's **pooled** address with the `ufc_app` login (if the provider has no pooler, its normal address).
   - `DIRECT_URL`: the standby's direct address with the owner login.
   - Remove `DATABASE_REPLICA_URL` if it is set (it points at the old database).
     Then **redeploy production** (a variable change does not apply until a new deployment).
5. **Check it.** Sign in with GitHub, open the members list, the leaderboard and an event page. Open a dashboard and watch for errors in
   the Vercel logs.
6. **Point the backups at it.** In the backup repository, change the `BACKUP_DATABASE_URL` secret to the standby's direct address with its
   `ufc_backup` login (created by step 3). Until you do, the backup job fails, on purpose, and emails you.
7. **Tell people.** Post in the club group: the site is back, and changes from roughly the last few hours may need to be redone.

## Afterwards

- The old database is now behind. Do **not** bring it back as a second writer. If it comes back, treat it as an empty target: when you
  are ready to move back, restore the current database's backup into it (see restore-database.md B), switch `DATABASE_URL`, and claim it
  again as in step 1 on whichever one is now the spare.
- Create a new standby so there is a spare again.
- Redis holds things derived from the old database (cached lists, poll notes). They correct themselves within a few minutes, so if
  something looks stale right after the switch, wait about 5 minutes before worrying.
- `TOKEN_ENCRYPTION_KEY` and `NEXTAUTH_SECRET` stay the same: members' stored GitHub connections still work and nobody is signed out.

## Do not

- Do not point two copies of the site at two different databases at once.
- Do not refresh the old primary from the standby and switch back in a hurry. Do it calmly, with a backup taken first.
