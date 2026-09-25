---
title: "XP that a heavier bar can't buy"
description: "How PaceStreak's XP, levels, personal records, achievements and leaderboards are built so that two people of very different strength earn exactly the same for the same week."
date: 2026-09-25T09:00:00Z
tags: ["product", "gamification", "python", "design"]
---

Gamification in fitness apps usually rewards magnitude: more weight, more
distance, more calories, more days. That's easy to measure, and it's exactly
the wrong incentive. It favours people who are already strong, it rewards
overtraining, and anything tied to a body tempts people towards unhealthy
places.

PaceStreak's game layer has one rule, written at the top of
`api/app/game/xp.py`:

> Two people of very different strength earn identical XP for the same week.

Everything below follows from it.

## Where XP comes from

| Source                     | XP              | Why                                                                                                         |
| -------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| A training day             | 20              | Showing up is the thing being rewarded.                                                                     |
| A second session that day  | 5               | Doubles are real, but splitting one workout into five must not pay. Anything after the second pays nothing. |
| Days beyond target + 1     | 5 instead of 20 | Training every single day is not better than the plan with rest in it.                                      |
| A day logged with detail   | 5               | Flat. It rewards completeness, never magnitude.                                                             |
| A kept week                | 50              | The unit of the streak.                                                                                     |
| A frozen or repaired week  | 0               | It keeps the streak alive, but a forgiven week isn't an earned one.                                         |
| Streak milestones          | 100 to 2,000    | At 4, 8, 12, 26, 52, 104 and 156 weeks.                                                                     |
| A rewarded personal record | 25              | Relative to your own history (see below).                                                                   |
| Achievements               | 50 / 100 / 200  | By tier.                                                                                                    |

There's no multiplier for weight, distance or duration anywhere in that table.
A beginner walking three times a week and an elite lifter training three times
a week earn the same.

Like the streak, XP is a pure function of history, recomputed whole. There is
no XP ledger to reconcile. Edit an old session and every total after it is
correct on the next read.

## Levels describe maturity, not strength

The level curve is `round(80 * n ** 1.6)` XP per level. It's a decelerating
curve, so early levels arrive quickly and later ones stretch out. Titles run
Novice, Regular, Consistent, Committed, Seasoned, Veteran, and the docstring is
explicit about what they measure:

> Titles describe _training maturity_: how long and how steadily someone has
> shown up, and never strength or body weight. A consistent beginner outranks a
> strong lifter who trains when they feel like it.

## Personal records, with two guards

Records are the one place magnitude has to appear. Nobody wants a tracker that
won't tell them they squatted more than last month. So records are kept, but
each one is **self-relative**: you against your own history, never anyone
else's. And two guards stop them being farmed:

- **Plausibility.** An improvement of more than 15% over your previous best is
  recorded, because it might be real, but it earns nothing and is never
  broadcast to the feed. A fat-fingered 500 kg curl mints no reward.
- **Cooldown.** One rewarded record per exercise per seven days, so retesting a
  max every day isn't a strategy.

Both guards came from the predecessor project, where both lessons were
learned the hard way.

## Achievements as declarative rules

There are 23 achievement rules in `api/app/game/achievements.py`. Each is a
small declarative object evaluated against a `Context` of counts: sessions,
active days, kept weeks, distinct exercises and disciplines, push and pull
sets, early and late sessions, the longest break someone came back from, and
so on. Adding a badge means adding a rule.

The constraint is written at the top:

> Every rule rewards something healthy: showing up, breadth, finishing, honest
> records, coming back. None rewards training every day, maximum weight, body
> weight, or training through a planned rest week.

"Coming back" deserves a mention. There's a badge for returning after a long
gap, because the moment someone returns after two months off is exactly when a
streak app usually makes them feel worst.

Tiered rules unlock one row per tier. If someone jumps straight past bronze to
silver they get both, so the trophy room reads the same however fast someone
progressed.

## Leaderboards that are hard to cheat

There are four boards:

- **Consistency:** the mean weekly score over four closed weeks, each capped at
  100% of your own target.
- **Streak:** current kept weeks.
- **Season XP:** this quarter's XP.
- **Season records:** this quarter's rewarded records.

Every one of them is either capped at your own plan or measured against your
own history. Being big wins nothing. Lying about a weight wins nothing, because
the plausibility guard means an implausible record earns nothing. Training
seven days a week wins nothing, because the score is capped and extra days pay
a quarter.

There is deliberately no board for weight lifted, distance, or anything
body-related. Boards are opt-in for the global scope, and people under 16 never
appear on them.

## Seasons

XP and records also count per quarter. Without seasons, the board belongs
forever to whoever started first. With them, someone who joined last week has
something to play for.

## Turning it all off

Some people want the log and the streak and nothing else. `gamification_enabled`
is a profile switch that removes XP, levels, badges and leaderboards from the
app entirely.
