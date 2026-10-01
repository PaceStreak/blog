---
title: "What you burn, from the scale and the food log"
description: "How PaceStreak estimates real daily energy expenditure from four weeks of logging, why it refuses to answer with thin or inconsistent data, and the caps on every suggested target."
date: 2026-10-01T11:00:00Z
tags: ["product", "nutrition", "statistics"]
---

Calorie apps guess what you burn from a formula: age, height, weight, an
activity multiplier you pick from a list. The guess is often hundreds of
calories off, and it never learns.

There's a better source: you. If you logged what you ate and the scale
moved, energy balance tells you the rest.

## The arithmetic

Over the last 28 days (ending yesterday, because today isn't over):

1. Average the calories logged per day.
2. Fit a straight line through the daily average weigh-ins. Its slope is
   the trend in kg per day. A least-squares line barely moves for one salty
   dinner, which is the point.
3. A kilogram of body mass is roughly 7,700 kcal. If the trend fell
   0.5 kg a week, the body covered about 550 kcal a day from storage.

Burn = average intake − slope × 7,700. Eat 2,000 a day while losing half a
kilo a week, and you burn about 2,550.

## When it won't answer

It needs **14 days of food, 8 weigh-ins, spread over at least 14 days**.
Below that it shows progress toward those numbers instead of a figure.

If the answer comes out under 1,000 or over 6,000 kcal, it says the food
log and the scale don't add up. That almost always means meals weren't
logged, and a wrong number on the screen would do more harm than none.

## The suggestion, kept gentle

With a weight goal set, the app suggests a calorie target toward it. Every
suggestion is capped:

- Losing at most **0.5% of body weight a week**.
- Never more than **750 kcal** below what you burn.
- Never under **1,200 kcal**.
- Within a kilo of the goal, it suggests maintenance.

PaceStreak has refused calorie and diet _habit templates_ since habits
shipped, because a streak for eating less is an incentive to undereat.
Nutrition arrived because people asked for it. The guard moved from
"never" to these caps, and calories still never touch XP, a badge or a
leaderboard.
