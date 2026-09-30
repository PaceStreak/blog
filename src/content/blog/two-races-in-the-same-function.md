---
title: "Two races in the same function, found the same day"
description: "recompute() reads a stats row, decides what's new, then writes a fresh one back - with no lock between the read and the write. Two concurrent calls could disagree about what changed, or insert the same badge twice."
date: 2026-09-27T13:39:43Z
tags: ["api", "gamification", "concurrency", "bugs"]
---

`recompute()` is the function that runs after almost anything a user logs -
a session, a habit day, a weigh-in - to work out what changed: did a streak
advance, did a badge unlock, did XP cross a level boundary. It reads a
`previous` `UserStats` row to know what the state was a moment ago, computes
the new state, and writes it back. That read-then-write, with nothing
holding the row still in between, turned out to have two separate bugs
hiding in it, both surfaced the same day by the same kind of event: two
calls landing for the same user at close to the same instant, which happens
naturally when an offline outbox flush races a live request on reconnect.

## The first race: two calls, one stale read

If two calls to `recompute()` for the same user both start before either
finishes, both can read the same `previous` row. Each one then computes
"what's new" relative to that same stale snapshot - so if the state crossed
a milestone between them, both calls can independently decide *they're* the
one that crossed it, and both fire the "you just reached level 12"
notification, or both think a level-up happened when only one write should
have produced it.

The fix takes a Postgres advisory transaction lock keyed on the user's id,
before anything is read:

```python
await db.execute(
    select(func.pg_advisory_xact_lock(func.hashtext(str(user_id))))
)
```

`pg_advisory_xact_lock` holds for the life of the current transaction and
releases automatically at commit - no explicit unlock, and no way for it to
leak past the request that took it. Two genuinely concurrent calls for the
same user now run one after the other instead of interleaving; calls for
*different* users never contend, since the lock key is per-user.

## The second race: NULL doesn't equal NULL

The second bug was specific to single (non-tiered) achievements - badges
that don't have a bronze/silver/gold progression, just "have it" or don't.
There was already a unique constraint meant to stop a badge being awarded
twice: `uq_user_achievement_tier` on `(user_id, achievement_id, tier)`. It
worked for tiered badges. It did nothing at all for single badges, because
`tier` is `NULL` for those, and Postgres - correctly, per the SQL standard -
treats every `NULL` as distinct from every other `NULL` under a unique
constraint. Two rows with the same `user_id`, same `achievement_id`, and
`tier = NULL` do not violate that constraint, because as far as uniqueness
is concerned, they aren't equal.

So two concurrent `recompute()` calls could both pass the "do you already
have this badge" check - reading before either had inserted - and both
insert, silently doubling that badge's XP payout. This is the second half of
the same underlying shape as the first bug: a check-then-act with nothing
enforcing it atomically, just manifesting through a different door.

The fix is a partial index that only covers the `NULL` case, which a plain
unique constraint structurally can't:

```python
op.create_index(
    "uq_user_achievement_single",
    "user_achievements",
    ["user_id", "achievement_id"],
    unique=True,
    postgresql_where="tier IS NULL",
)
```

With that in place, the insert path uses `ON CONFLICT DO NOTHING` against
it - a genuine race now lands on one row and one payout instead of a
duplicate, rather than needing the advisory lock to prevent the race from
reaching the insert at all. Belt and suspenders: the lock stops the races
that matter for correctness of *state*, the partial index stops this one
specific race from mattering even if something else ever calls the insert
path outside `recompute()`'s lock.

Both fixes shipped with tests that actually run two coroutines concurrently
against the same user and assert on what's left afterward - a single
consistent `UserStats` row, and exactly one copy of the badge - rather than
asserting the code merely doesn't throw.
