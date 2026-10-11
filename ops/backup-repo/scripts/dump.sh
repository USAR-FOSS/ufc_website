#!/usr/bin/env bash
# Takes one backup of the database, proves it can be restored, and encrypts it.
#
#   needs:  BACKUP_DATABASE_URL  direct address of the database, using the read-only ufc_backup login
#           AGE_PUBLIC_KEY       the public key (age1...) the file is encrypted to. Only the matching private key can open it.
#           CORE_TABLES          optional: comma separated tables that must exist (default: the website's). Set it for another database.
#           RESTORE_CHECK_URL    an empty scratch Postgres to test the restore in (the workflow provides one). Without it the script
#                                refuses to run, because an untested backup is not worth publishing; set SKIP_RESTORE_CHECK=yes to say
#                                you know (for a quick local try, never for the scheduled job).
#   makes:  out/ufc-<time>.dump.age   (and leaves out/ufc-<time>.dump next to it for the steps that follow; delete it afterwards)
#
# What "proves it can be restored" means: the dump is loaded into a scratch database and the number of rows in every table is compared with
# the live database. A backup that cannot be restored is worse than none, because you believe you have one.
#
# The check fails (and so does the backup) if a count query fails, if no tables were counted, if the live database does not have the club's
# core tables, or if the restored copy does not have exactly the same tables as the live one.
set -euo pipefail

: "${BACKUP_DATABASE_URL:?BACKUP_DATABASE_URL is not set}"
: "${AGE_PUBLIC_KEY:?AGE_PUBLIC_KEY is not set}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="${OUT_DIR:-out}"
mkdir -p "$out"
stamp="$(date -u +%Y%m%dT%H%MZ)"
dump="$out/ufc-$stamp.dump"

if [ -z "${RESTORE_CHECK_URL:-}" ] && [ "${SKIP_RESTORE_CHECK:-}" != "yes" ]; then
  echo "::error::RESTORE_CHECK_URL is not set, so this backup could not be test-restored. Set it, or SKIP_RESTORE_CHECK=yes to go without."
  exit 1
fi

# Every table in the public schema and its exact row count, one "name count" per line. The tables are found in the database rather than
# listed here, so a migration that adds, renames or removes one cannot leave this checking a stale list.
counts_sql="
select c.relname, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by 1"

# ON_ERROR_STOP: a failed count must stop everything, never leave an empty file that looks like "nothing to compare".
count_rows() {
  psql "$1" -X -At -F ' ' -v ON_ERROR_STOP=1 -c "$counts_sql" > "$2"
  cat "$2"
}

echo "::group::Counting rows (before)"
count_rows "$BACKUP_DATABASE_URL" "$out/before.txt"
echo "::endgroup::"

echo "::group::Dumping"
# --no-owner/--no-privileges: the copy can be loaded by any login, which is what you want on the day you need it.
pg_dump --format=custom --no-owner --no-privileges --schema=public --file "$dump" "$BACKUP_DATABASE_URL"
ls -l "$dump"
pg_restore --list "$dump" > /dev/null
echo "::endgroup::"

echo "::group::Counting rows (after)"
count_rows "$BACKUP_DATABASE_URL" "$out/after.txt"
echo "::endgroup::"

if [ -n "${RESTORE_CHECK_URL:-}" ]; then
  echo "::group::Restoring into a scratch database to prove it works"
  "$here/restore.sh" "$dump" "$RESTORE_CHECK_URL" --scratch
  count_rows "$RESTORE_CHECK_URL" "$out/restored.txt"

  # Rows can be added or removed while the dump runs, so a table is allowed to land anywhere between the count before and the count after
  # (with a little room). Anything outside that means the copy is not the database.
  python3 - "$out/before.txt" "$out/after.txt" "$out/restored.txt" <<'PY'
import sys

# Tables the data cannot exist without. If the database being backed up does not have these, it is the wrong database, or something
# has gone badly wrong, and a "passing" check on whatever is left would mean nothing. The website's tables unless CORE_TABLES (a comma
# separated list) says otherwise, which is how a different database (the OIDC service's) is checked.
import os
DEFAULT_CORE = "users,events,event_attendees,github_stats,leetcode_stats,activities"
CORE = {t.strip() for t in os.environ.get("CORE_TABLES", DEFAULT_CORE).split(",") if t.strip()}


def read(path):
    rows = {}
    for line in open(path):
        if not line.strip():
            continue
        name, count = line.split()
        rows[name] = int(count)
    return rows


before, after, restored = (read(p) for p in sys.argv[1:4])
problems = []

for label, rows in (("live (before the dump)", before), ("live (after the dump)", after), ("restored copy", restored)):
    if not rows:
        problems.append(f"{label}: no tables were counted")
    elif CORE - set(rows):
        problems.append(f"{label}: missing core tables {sorted(CORE - set(rows))}")

if not problems:
    if set(before) != set(after):
        problems.append(f"the tables changed while the dump ran (a migration?): {sorted(set(before) ^ set(after))}. Run it again.")
    if set(restored) != set(before):
        problems.append(
            f"the restored copy has different tables: missing {sorted(set(before) - set(restored))}, extra {sorted(set(restored) - set(before))}"
        )

if not problems:
    for table, was in before.items():
        lo, hi = min(was, after[table]), max(was, after[table])
        got = restored[table]
        if got < lo - 5 or got > hi + 5:
            problems.append(f"{table}: live {was}..{after[table]}, restored {got}")

if problems:
    print("RESTORE CHECK FAILED\n  " + "\n  ".join(problems))
    sys.exit(1)

print("restore check passed: " + ", ".join(f"{t}={restored[t]}" for t in sorted(restored)))
PY
  echo "::endgroup::"
else
  echo "::warning::SKIP_RESTORE_CHECK=yes: this backup was NOT test-restored."
fi

age -r "$AGE_PUBLIC_KEY" -o "$dump.age" "$dump"
ls -l "$dump.age"
echo "$dump" > "$out/latest.txt"
