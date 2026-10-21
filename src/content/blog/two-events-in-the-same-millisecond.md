---
title: "Two events in the same millisecond"
description: "The feed paged by timestamp alone, so two events created in the same millisecond could fall between pages and never be shown. The fix is a cursor made of the time and the id together."
date: 2026-10-21T12:00:00Z
tags: ["api", "bug", "database"]
---

The social feed is paged. The API returns 25 events and a `next` cursor,
and the app sends the cursor back to get the next 25. Until this week the
cursor was a timestamp, and the next page asked for events created before
it:

```sql
WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 25
```

## The gap

That query is correct as long as no two events share a timestamp. Events
are stored to the millisecond, so a tie sounds rare. It isn't: logging a
session can create several events in one request (the session, a new
record, a badge), and they are written together.

Suppose the 25th event on a page and the 26th share a millisecond. The
cursor is that millisecond. The next page asks for events strictly
_before_ it, so the 26th event, created at exactly that time, is skipped. It
never appears on any page. Nothing errors. Someone's badge just isn't in
anyone's feed.

## The fix: compare the pair

The order now has a tiebreak, the event's id, and the cursor carries both:

```sql
WHERE (created_at, id) < (:at, :id)
ORDER BY created_at DESC, id DESC LIMIT 25
```

SQLite compares the pair the way you'd compare words in a dictionary: by
time first, and only on a tie by id. Every event has a distinct id, so
every event has exactly one place in the order, and every page boundary
falls between two definite events.

The index changed to match. `ix_activity_feed` is now on
`(user_id, created_at, id)`, so the query is still an index range scan.
Migration 0007 recreated it, and the query-plan lint in CI checks it for
both cursor kinds.

## Opaque on the wire

The cursor is no longer something a client should read. It is base64url of
`<ms>.<id>`:

```ts
export function encodeCursor(c: { at: number; id: string }): string {
  return b64urlEncode(utf8(`${c.at}.${c.id}`));
}
```

The app already passed `next` back unchanged, so it needed no edit. The old
plain-timestamp cursor is still accepted, so a page that was open during
the deploy keeps working. It pages by time alone, with the old gap, until
the next request returns a new cursor.

The same fix applies to all three places that page this way: your feed, a
person's events and a group's feed.

## The test

The test is exactly the failure: put two events in the same millisecond
across the 25-item boundary, read both pages, and check that every event
appears exactly once. It runs against all three endpoints. A second test
keeps the old cursor's behaviour on record: it skips the second event of a
tied pair, which is the bug, and is only still possible for a client that
sends an old cursor.
