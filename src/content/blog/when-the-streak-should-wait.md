---
title: "When the streak should wait: pauses, planned rest and importing from a watch"
description: "Five features built in one pass: an injury pause that can't be abused, planned rest on the grid, a weekly recap, GPX/FIT/CSV import without third-party sync, a private calendar feed, and an official account nobody can imitate."
date: 2026-09-25T14:00:00Z
tags: ["product", "streaks", "api", "security"]
---

The week-based streak already forgives a lot: rest days are free, freezes are
earned, and one missed week a month can be repaired. What it couldn't handle
was the thing that most often ends a training habit: **getting hurt.** A
sprained ankle is three weeks, not one, and no amount of freezes covers that.

So this round added a pause, and four other things from the same list.

## Pause mode, and why it has limits

A pause is declared with a reason (injury, illness, life, other), a start
date and an optional end. The engine gained one status, `paused`:

```python
if count >= target:
    status = "kept"
elif w in paused_weeks:
    status = "paused"
elif w == current_week:
    status = "open"
```

A paused week **neither breaks the run nor extends it.** It spends no freeze,
earns no freeze, pays no XP, and is left out of the consistency score. A week
you trained through anyway is still kept. The pause doesn't take anything
away.

The interesting part is the limits, because an unlimited pause is just a way
to hold a streak (and a place on the streak leaderboard) without training:

- **It must cover most of a week.** A week is sheltered only if the pause
  covers at least four of its days. Otherwise a one-day pause dropped into
  every week would quietly turn a target of three into a target of two.
- **Up to 14 days back, 30 ahead.** People open the app a few days after an
  injury, not during it. And an operation can be planned.
- **Twelve weeks per pause, 120 days a year.** An open-ended pause counts as
  running to its cap, so forgetting to end one can't shelter a streak forever.
- **No overlaps**, and a pause that has already sheltered weeks can be ended
  but not deleted. Deleting it would silently break a streak it had been
  holding.

The rules live in `app/training/pauses.py` as pure functions, tested without a
database, and the streak engine only ever sees the set of paused days.

## Planned rest on the grid

Profiles already had an optional `training_days` bitmask, used only to time
reminders. Now the grid uses it too. A day outside your plan with no session
renders as _planned rest_ (outlined), and paused days are hatched. Each state
has a text title and a legend entry, so none of it depends on colour.

Before, a three-day plan made the grid look like four failures a week. Now
it looks like a plan.

## A weekly recap

`GET /v1/me/recap` returns one week: days against target, the verdict, the
streak, sessions per discipline, records and badges. It deliberately reports
**no volume**: no tonnage, no distance totals, no calories.

The Monday digest now calls the same builder and links to `/recap`, so the
notification and the screen can't tell two different stories.

## Importing from a watch without anyone's API

The obvious way to get watch data in is OAuth sync with each vendor. That's a
third party per vendor, a token store, and a CSP hole, all of which this project
has ruled out. So it takes **files**: GPX, FIT and CSV, which every watch and
app can export.

- **GPX** is parsed with `defusedxml`, so an uploaded file can't use entity
  expansion or external entities against the server. Distance is haversine
  over the track. Elevation gain ignores climbs under 3 m, because summing raw
  GPS noise inflates it several times over.
- **FIT** is read with `fitdecode`, from the `session` messages.
- **CSV** is forgiving about column names and units. A bare `date` lands at
  midday local, so no timezone can push it onto the neighbouring day.

Imported sessions get a **deterministic id**:
`uuid5(namespace, user + discipline + start time)`. Upload the same file twice
and nothing doubles. On top of that there's a three-minute window, so the same
run uploaded once as GPX and once as FIT also lands once. Imports are marked
`source="import"`: they count for the personal streak and the grid, never for
challenges, and records inside them earn nothing. Backfilling a year of
history can't top a board.

## A calendar feed with the URL as the credential

Calendar apps poll a URL and can't send a token, so the URL has to be the
credential. That shapes everything:

- 32 random bytes, **shown once**, and stored only as a SHA-256. A database
  leak doesn't hand out working feeds.
- Create, rotate and revoke from settings; each one is written to the
  security history.
- The feed carries the minimum: time, discipline, title, duration or distance.
  Never notes, sets or body metrics.
- Proper RFC 5545 output: text escaping, and lines folded at 75 _octets_
  without splitting a UTF-8 character. The one-off ICS export now uses the
  same builder.

## An official account nobody can imitate

`@pacestreak` was already reserved, along with every handle starting with it.
That protected the brand from impersonation, but it also stopped the brand
from having an account.

The fix doesn't loosen the reservation. An **admin-only, audited endpoint**
sets `is_official` and is the only path by which a reserved handle can be
assigned. The official account gets a verified mark (an icon with a text
label). And the check got stricter for everyone else: the brand name is now
caught anywhere in a handle or display name, after stripping separators and
folding look-alikes, so `real_pace_streak` and `Pace5treak` are refused too.

## Shortcuts

The PWA manifest already had a "Log a session" shortcut. It now also offers
"Start a live workout" and "Last week's recap": long-press the icon and you're
one tap from either.

## What it cost

One migration, two small dependencies (`fitdecode`, `defusedxml`), and 20 new
tests, 87 in total, all against a real Postgres and Redis. The dev container
also finally mounts `alembic/`. Before, it only saw the migrations baked into
the image, which is how a missing table once took down login locally.
