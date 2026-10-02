---
title: "An undo that is a restore"
description: "Every delete in PaceStreak now offers Undo, backed by a 30-day trash on the server. Why the trash stores generic snapshots, keeps original ids, and refuses a restore that would clash."
date: 2026-10-02T09:00:00Z
tags: ["product", "api", "data"]
---

Undo is usually built in the client: hide the row, wait five seconds, then
send the delete. That breaks the moment the tab closes, the phone sleeps or
the delete happens on another device. PaceStreak's undo is a **restore**
instead: the server deletes straight away, keeps a copy, and Undo puts the
copy back.

## A snapshot, not a soft delete

Adding `deleted_at` to every table means every query, everywhere, has to
remember to filter it out, and one that forgets shows deleted data. So the
trash is one table: `trash_items`, holding a JSON snapshot of what was
deleted.

The snapshot is generic. It walks the model's columns, stores dates as ISO
strings and UUIDs as text, and on restore converts each value back by its
SQL type. A habit's snapshot carries its logs as children, so restoring it
brings back its whole history. A column added to `Habit` next month is
carried through without anyone touching the trash code.

Workouts are the exception: they were already soft-deleted, because offline
sync needs tombstones. Restoring one clears `deleted_at` and takes a new
sync sequence number, which is what makes every device pick it up.

## Same id, so nothing dangles

Restored rows keep their original ids. A meal that pointed at a saved food
points at it again once the food is back. A routine still lists the habit.

## Refusing, cleanly

If something now sits in its place, like a new journal entry for the same
day or a food saved with the same barcode, the restore fails with a 409 and
changes nothing. It never overwrites the newer thing, and the trash entry
stays, so it can be retried after you sort out which one you want.

After 30 days the worker deletes trash entries for good. Emptying the trash
early does the same, at once.
