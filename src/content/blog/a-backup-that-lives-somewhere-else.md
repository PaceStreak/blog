---
title: "A backup that lives somewhere else"
description: "D1 Time Travel can rewind the database to any minute in its window. We added a nightly copy of the whole database into Postgres on another provider, because a backup should not share every failure with the thing it backs up."
date: 2026-10-19T19:00:00Z
tags: ["infrastructure", "data", "backups", "cloudflare"]
---

Until 19 October, our written position was that we didn't need an off-host
backup. The database's own restore history was the only copy, and our
privacy page said so. When the API moved to Cloudflare D1, we changed our
minds. This post covers what protects PaceStreak's data now, and why there
are two layers.

## Layer one: D1 Time Travel

D1 keeps a rolling restore history. You can restore the database to any
minute inside the window: 7 days on the plan we run today, 30 on Workers
Paid. It takes one command, needs no setup, and covers the most common
disaster, which is a bad migration or a bad write.

It has two properties worth being honest about:

- **A restore rewinds the whole database**, every account included. It's
  a tool for undoing a mistake that hit everyone, not for recovering one
  person's deleted workout. Per-item mistakes are handled by the app's own
  trash, which keeps deleted things restorable for a while.
- **It lives in the same place as the database.** Same provider, same
  account, same credentials. If something goes wrong at that level, such as
  a database deleted by mistake, an account problem or a provider incident,
  the restore history is exposed to the same failure.

The second point is the reason for layer two.

## Layer two: a nightly copy in Postgres

Every night at 23:30 IST, a GitHub Actions workflow:

1. **Exports** the production D1 database with `wrangler d1 export`, as a
   SQL dump.
2. **Replays** the dump into an in-memory SQLite, so the script reads the
   real tables and not a text file.
3. **Copies** every table into a Postgres database at Neon, in a schema
   called `d1_backup_new`.
4. **Swaps** `d1_backup_new` in for the live `d1_backup` schema, in one
   transaction.
5. **Deletes** the export from the runner, whether or not the run
   succeeded.

The swap is the important step. A run that fails part-way through leaves
the previous night's copy exactly as it was. You never end up with half a
backup in place of a whole one.

Column types follow SQLite's type affinity: integers become `bigint`,
reals become `double precision`, blobs become `bytea`, and everything else
becomes `text`. Constraints and indexes aren't copied. It's a copy to read
and restore from by hand, not a second live database. The script prints
row counts and never row contents, so the workflow log holds nothing
personal.

## Why another provider

Two copies on the same platform protect against fewer failures than two
copies on different ones. The nightly copy doesn't share Cloudflare's
account, credentials or infrastructure. If something takes out the D1
database together with its Time Travel history, last night's data is still
somewhere else, in an ordinary Postgres anyone can read with ordinary
tools.

The cost of this design is a gap of up to a day. Anything written since the
last nightly run exists only in D1 and its Time Travel. Losing at most a day, and
only in a case where Time Travel is gone as well, is a trade we're
comfortable with.

## What a backup is not

A backup shouldn't keep data you deleted on purpose any longer than it has
to. When an account is deleted, it's removed from the database. The nightly
copy is replaced each night, not added to, so the account is gone from it
by the next run. Time Travel's history ages out on its own at the end of
its window. Neither one keeps an archive of old nights.
