---
title: "Importing another app's history, and refusing 03/04"
description: "Switching habit apps shouldn't cost a streak. How PaceStreak reads Loop's export and generic CSVs, why only year-first dates are accepted, and why an import never overwrites a day."
date: 2026-10-01T13:00:00Z
tags: ["product", "habits", "import"]
---

The biggest reason people stay in a habit app they've outgrown is the
grid. Two years of ticks is hard to leave behind. So habit import shipped
alongside the rest of the new features: bring the history, keep the
streak.

## Two shapes cover almost everything

Exports in the wild come in two shapes.

**Wide**: a date column, then one column per habit. Loop Habit Tracker's
`Checkmarks.csv` is this shape, inside its export zip or on its own.
Loop's values need care: `2` means ticked by hand, `1` means _implied_ by
the habit's frequency, `0` not done, `-1` unknown. Only `2` counts.
Importing the implied ones would invent days nobody did.

**Long**: one row per habit per day, with a date column and a name
column: Habitify-style exports and most spreadsheets. A value column, if
there is one, becomes the amount. Otherwise each row is a tick.

The parser finds columns by header name, sniffs comma, semicolon or tab,
and copes with UTF-8, UTF-16 and Latin-1.

## Year first, or not at all

`03/04/2026` is the 3rd of April in most of the world and the 4th of
March in the US. Guessing would quietly move a year of history by weeks,
and nobody would notice until a streak looked wrong. So only year-first
dates are accepted (`2026-04-03`, `2026/04/03`, or a timestamp that starts
that way). Anything else gets a clear error that says how to fix the file.

## Preview, merge, never overwrite

Import runs twice. First as a dry run that lists each habit, how many
days, the date range, and whether it merges into a habit you already have
(same name, ignoring case). Nothing is written until you confirm.

Then:

- Days you already logged here are **never overwritten**. Importing the
  same file twice adds nothing the second time.
- New habits start with a weekly target matching how often you actually
  did them, so the streak starts honest rather than broken.
- The streak engine recomputes once at the end, not once per day.
