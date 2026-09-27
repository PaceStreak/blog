---
title: "One sheet for every habit day"
description: "Logging a habit works the same from the Today row, the week strip and the calendar: a big minus and plus, a few one-tap amounts, and a note."
date: 2026-09-25T09:00:00Z
tags: ["app", "ux", "habits", "react"]
---

There are three places in PaceStreak where you might want to set a habit's
amount for a day: its row on Today, the week strip, and the calendar on its
own page. Early on they each had their own control. Now they all open the
same sheet.

## What the sheet holds

- **The day**, in words: "Today", or "Yesterday · Saturday 26 September".
- **A big minus and plus** around the amount, sized for a thumb. The step is
  chosen per habit, so a steps habit does not make you tap a thousand times.
- **A progress bar** toward the day's goal for counted and timed habits.
- **One-tap amounts** such as +10 min or +30 min, plus "Hit the goal" when
  you are short of it.
- **A field** for typing any other amount.
- **A note**, up to 280 characters, private like the habit itself.

A simple tick habit skips the counter and shows Done and Not done instead;
it opens the sheet only when you want to add a note or fix a past day.

## Why one sheet

Consistency is not an aesthetic preference here. If logging works one way on
Today and another in the calendar, you have to remember which place you are
in before you can do the one thing you came to do. With one sheet, the
motion is learned once.

It also means one code path to get right: rounding, offline queueing,
preserving a note when only the amount changes, and the message you see when
you are offline ("Saved on this phone. It syncs when you're back online.").

## Clear is not Save zero

If a day already has an amount, the sheet shows a separate **Clear** button.
Resetting to zero with the minus button works too, but an explicit Clear
makes the intent obvious, and obvious intent is what you want from a control
that deletes something.
