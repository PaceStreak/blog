---
title: "Merging two accounts by asking Postgres what points at them"
description: "Moving everything one account owns into another, without a hand-kept list of tables that is out of date the day a table is added."
date: 2026-10-02T16:00:00Z
tags: ["engineering", "data", "postgres"]
---

Someone with two PaceStreak accounts wanted one: keep the login of the new
one, keep the history and the profile of the old one. That's an admin tool now
(`POST /v1/admin/users/{id}/merge`), and the interesting part is what it does
*not* contain: a list of tables.

## The list that goes stale

The obvious version is `update workouts set user_id = :dest where user_id =
:source`, then the same for habits, food, journal, follows, groups, badges and
the rest. That works until someone adds a table. Then the merge either leaves
the new rows behind, or, worse, the final `delete from users` cascades and
quietly deletes them.

## Asking the database instead

Postgres already knows every column that references `users`; it has to, to
enforce the foreign keys. So the merge reads them from `pg_constraint` at run
time:

```sql
select cl.relname, att.attname
from pg_constraint con
join pg_class cl on cl.oid = con.conrelid
join pg_attribute att on att.attrelid = con.conrelid
                      and att.attnum = any(con.conkey)
where con.contype = 'f' and con.confrelid = 'users'::regclass
```

A table added next year is merged too, with no change to the merge.

## Three rules for the awkward rows

**Sign-in material doesn't move.** Sessions, one-time codes, passkeys,
recovery codes and WebAuthn challenges stay behind and die with the source. The
old account's credentials must never start opening the new one.

**Rows linking the two accounts are dropped.** A table with two user columns,
like a follow, would turn "old follows new" into "new follows new". Those rows
are deleted first.

**Collisions go to the destination.** If both accounts have a row that must
be unique, such as the same badge or the same day's habit log, the
destination's copy wins. Each table is first tried as one `update` inside a
savepoint; if that hits a unique violation, its rows are moved one at a time,
each in its own savepoint, and only the ones that collide are dropped. When the
caller wants the old account's profile instead, it's moved out of the way
first.

All of it runs in one transaction. Either everything has moved and the source
is gone, or nothing happened.

## The part that wasn't in the database

The first real merge taught one more lesson: an account's data isn't only on
the server. The person had a session open on a phone that hadn't synced yet,
and the account it belonged to stopped existing. That's the subject of
[the next post](/posts/a-sign-out-must-not-lose-a-session).
