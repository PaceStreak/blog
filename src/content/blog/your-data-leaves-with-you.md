---
title: "Your data leaves with you"
description: "Export as JSON, CSV or calendar; import it back; delete with a 30-day safety net; units that can't corrupt history; and moderation that never touches your training log."
date: 2026-09-25T15:00:00Z
tags: ["product", "privacy", "api", "data"]
---

The public site promised "full JSON and CSV export from day one" before there
was a line of backend code. The API's README turned that into a constraint:

> Export is a launch requirement, not a later feature. Design the schema so a
> complete export is a query, not a migration.

This is how that promise is kept, and the few other decisions that exist
because the training log belongs to the person who wrote it.

## Three export formats

`GET /v1/me/export?format=` answers with one of:

- **`json`**: everything. Sessions, sets, records, badges, streak chains and
  their target history, repairs, pauses, body metrics, settings, and social
  data. It's the complete account, and it's re-importable.
- **`csv`**: a zip of `workouts.csv`, `sets.csv` and `body_metrics.csv`, for a
  spreadsheet.
- **`ics`**: your sessions and pauses as calendar events.

Every export is rate-limited, sent with `Cache-Control: private, no-store`, and
written to the security history, because a full export is exactly what an
attacker with a stolen session would take.

For a calendar that stays current, there's now also a private subscription
feed. The [previous post](/posts/when-the-streak-should-wait) covers how that
URL is protected.

## Import is idempotent

`POST /v1/me/import` takes a PaceStreak JSON export, on the same account or a
new one. Workouts keep their ids, so importing the same file twice skips what's
already there. Pauses come back as history, never overlapping one already
present.

Imported sessions are marked `source="import"`. They count for your streak and
grid but not for challenges, and records in them earn nothing. That's the same
rule the new GPX/FIT/CSV file import follows.

## Units that can't corrupt a PR

From `app/src/lib/units.ts`:

> Stored values are always kilograms and metres. Everything here converts at
> the display edge and nowhere else. The predecessor app stored "whatever unit
> was selected", and a kg/lb switch silently corrupted every PR.

A switch in settings changes what you see, never what was recorded.

## Deletion with a safety net

`POST /v1/me/delete` needs your password, schedules deletion 30 days out and
signs you out everywhere. Signing back in during the grace period is how you
cancel it, and the app shows a banner offering exactly that. After 30 days the
worker purges the account, and the database's `ON DELETE CASCADE` takes
everything with it.

## Moderation leaves the log alone

A moderation decision is about what someone shows other people, not about
their own history. Suspension removes social privileges only. A suspended
person can still log, see their history and export it.

## Private things stay private

- Workout notes and pause notes are never shown to anyone but their author.
- Body metrics are never shared, never on a board and never in the feed.
- The calendar feed carries no notes, sets or metrics.
- The profile stores a birth _year_ for the age gate, not a date of birth.

None of this is clever. It's a list of the places where a fitness app usually
decides your data is its data, with the opposite decision made in each one.
