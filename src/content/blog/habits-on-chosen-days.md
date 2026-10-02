---
title: "Habits on chosen days, and pausing just one"
description: "A habit can now be planned for specific weekdays, and paused on its own while everything else carries on. Both had to mean the same thing to the streak, the reminders and the badge."
date: 2026-10-02T14:30:00Z
tags: ["habits", "streaks", "product"]
---

Two requests kept coming up about habits. "I only go to the language class on
Tuesdays and Thursdays." And "I'm injured, so stop asking me about running,
but keep everything else going."

## Chosen weekdays

A habit can now be planned for chosen days of the week. Under the hood it's a
seven-bit mask, Monday as bit 0, and `null` means every day, so every existing
habit kept meaning what it meant.

What the schedule changes:

- **Today** only lists the habit on its planned days. On the others it's
  still there on the habit page, and doing it anyway still counts.
- **Reminders** only fire on planned days.
- **The first week.** A habit started mid-week can only ask for the days left
  in that week. With a schedule it counts only the *planned* days left, so a
  Tuesday-and-Thursday habit started on a Friday doesn't fail its first week by
  design.

What it doesn't change: streaks still count weeks, and the weekly target is
still yours. The schedule says *when* you plan to; the target says *how often*
counts.

## Pausing one habit

There was already a pause for everything: travel, illness, a planned break.
Now a single habit can be paused on its own, from its page, with an optional
end date. Its paused days are treated exactly like the whole-life pause treats
every habit's: they aren't misses, a paused week doesn't count against the
habit's streak or its strength, and its reminders stop. Everything
else carries on exactly as before.

When the pause ends, the habit comes back on its own, with nothing to
re-enable.

## One engine

Both live in the same place as repairs and the whole-life pause: the habit
engine that every screen, the reminder worker and the home-screen badge read
from. That's the point. A paused habit that the badge still counted, or a
scheduled one that sent a reminder on its day off, would be worse than not
having the feature.
