---
title: "The habit that said zero weeks after ten ticked days"
description: "A daily habit started on a Thursday showed a 0-week streak after ten straight days. The first week had been judged against seven days when only four existed."
date: 2026-09-26T20:00:00Z
tags: ["streaks", "bugs", "habits"]
---

A screenshot came back from real use: *Seven hours' sleep*, ticked every day for
ten days, streak **0 wk**, best **0**.

## Why

Streaks in PaceStreak are weekly: a week is kept when you hit your target that
week. Sleep had a target of every day, seven of seven. It was started on a
Thursday, so the first week had only four days left in it. The engine asked
that week for seven, got four, and marked it missed. The second week was still
in progress, so the streak read zero.

That's correct by the letter of the rule and wrong by any reasonable reading of
it. Nobody who starts a daily habit on a Thursday has failed their first week.

## The fix

The first week asks for no more than the days that were left:

```python
def first_week_target(weekly_target, started_on, week):
    if week <= started_on < week + timedelta(days=7):
        return max(1, min(weekly_target, 7 - (started_on - week).days))
    return weekly_target
```

Three days a week, started on Thursday: still three, because three fit. Every
day, started on Thursday: four. Every later week asks for the full target.

## The part I got wrong first

The test I wrote expected a streak of one after eleven daily ticks from a
Thursday. It got two. The engine was right: eleven days from Thursday runs
through the whole next week, which is kept too. The fix was to the test, and
the habit page now says so in words: *the first week only asks for the days
left after you started.*
