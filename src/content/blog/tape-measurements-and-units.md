---
title: "Tape measurements, stored in centimetres"
description: "Body data grew from weight and waist to a full tape measure, neck to calf. Everything is stored in centimetres and converted only at display, the same rule as kilograms and metres."
date: 2026-09-26T17:00:00Z
tags: ["body", "api", "units"]
---

Weight on its own is a noisy number. People training for shape rather than a
scale reading ask for the tape measure: waist, chest, arms, thighs. So body
data now covers nine measurements: neck, shoulders, chest, waist, upper arm,
forearm, hips, thigh and calf.

## One unit in the database

The rule PaceStreak already follows for weight (always kilograms) and distance
(always metres) applies here: **centimetres in storage, conversion only at
display**. Someone whose profile uses miles sees inches; the stored value
doesn't change, and exports are always centimetres.

```ts
export const toCm = (v: number, u: "cm" | "in") => (u === "cm" ? v : v * 2.54);
export const fromCm = (cm: number, u: "cm" | "in") => (u === "cm" ? cm : cm / 2.54);
```

## One side, same time

The form says it plainly: measure the same side, at the same time of day, with
the tape snug but not pressing. Limb measurements vary more from technique than
from a week of training, and a chart can't fix that.

## Any day, not just today

Measurements can be entered for any day in the last year, and each field shows
your last reading as a grey placeholder, so you know what you're comparing
against before you type.

## Change, not judgement

A *Tape progress* list shows each measurement's latest value and how far it has
moved since the first reading. There's no colour for good or bad. A waist going
down and an arm going up are both just numbers; which one you wanted is yours
to know. And like every body number in the product, none of it reaches XP, a
badge or a leaderboard.
