---
title: "Strength: a kinder number beside the streak"
description: "Every habit has a weekly streak and a strength score. The first version of strength was a rolling daily average that punished the start of every week. It's now a slow average over weeks."
date: 2026-09-26T14:00:00Z
tags: ["streaks", "habits", "design"]
---

A streak is brutal by design: miss a week and it's back to zero. That's what
makes it work, and it's also why people quit after breaking one. So each habit
has a second number, **strength**, in the spirit of Loop Habit Tracker's habit
score: slow to rise, slow to fall.

## The first version was wrong

Strength started as a rolling average over days. The problem showed up on
Mondays: a three-days-a-week habit, freshly into a new week with nothing done
yet, looked like it was failing. The number dipped every week at exactly the
point where nothing had gone wrong.

## Weeks, not days

It's now an average over weeks of how much of each week's target you met:

```python
values = [min(1.0, c.days / c.target) for c in weeks
          if c.status != "paused" and (c.status != "open" or c.days >= c.target)]
score = values[0]
for value in values[1:]:
    score += 0.25 * (value - score)
```

- Each week counts as the fraction of its target you met.
- The week in progress only counts once it's met, so a Monday isn't a failure.
- Paused weeks are skipped.
- Each new week moves the score a quarter of the way, so it has about a month
  of memory.

A missed week dents it; it doesn't erase months. The habit page says exactly
that under the number, because a score nobody can explain is a score nobody
trusts.
