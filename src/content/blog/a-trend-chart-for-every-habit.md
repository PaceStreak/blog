---
title: "A trend chart for every habit, using the colours it already had"
description: "A small bar row and a keep-rate percentage on every habit's detail page - kept in lime, missed in flame, because the week strip and calendar markers already meant that, and a new chart is the wrong place to invent a third colour convention."
date: 2026-09-27T13:24:42Z
tags: ["app", "api", "habits", "design"]
---

Habit detail pages had a lot on them already - the month calendar, notes,
the settings sheet - and nothing that answered the simplest question: is
this one actually going well, lately? A new `GET /habits/{id}/stats`
endpoint and a small bar row on the detail page answers it directly, with a
keep-rate percentage next to it.

## Reusing a convention instead of inventing one

The interesting constraint on this feature wasn't the data, it was the
colour. PaceStreak already has a kept/missed convention running through the
week strip and the month calendar's markers: lime for a day that counted,
flame for one that didn't. A new chart is exactly the kind of place a second
colour scheme quietly creeps in - blue for "good," red for "bad," because
that's what charts default to - and once that happens, the app is teaching
two different colour languages for the same underlying fact depending on
which screen someone's looking at.

The trend chart uses the existing convention instead: kept days in lime,
missed days in flame, the same two colours someone already reads correctly
everywhere else in the app before they've looked at a single label. That's
a small decision that doesn't show up in a screenshot comparison against
"just build a chart," but it's the difference between an app with one
visual vocabulary and an app with a different one per feature, which is how
consistency erodes one shipped feature at a time.
