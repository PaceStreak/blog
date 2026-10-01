---
title: "Insights without a model"
description: "PaceStreak's insights compare your own days with a Welch t-test, not an AI. Why the bar for showing a pattern is deliberately high, and why the app tells you it's correlation."
date: 2026-10-01T10:00:00Z
tags: ["product", "insights", "statistics", "privacy"]
---

The apps PaceStreak gets compared with sell "AI feedback": send your day to
a language model, get back a paragraph. We have two rules that make that
a non-starter. Nothing you log goes to a third party, and nothing on a
screen may claim something the data doesn't support. A model writing
confident sentences about your sleep breaks both.

So insights are arithmetic.

## What it compares

Each insight pairs a **driver** with an **outcome**: sleep hours with the
share of habits kept, the morning energy rating with whether you trained,
training with mood, protein with mood, and a few more. There are thirteen
pairs, each chosen because it reads as a sentence someone would act on.

For each pair, the engine takes the last 90 days and splits them in two.
For a yes/no driver like training, that's days you trained against days
you didn't. For a number like sleep, it's at or above your median against
below it. Then it compares the outcome's average across the two halves.

## When it stays quiet

Most of the code decides when **not** to say anything:

- Both halves need at least **8 days**. Three good nights prove nothing.
- The gap has to matter: 10 percentage points of habits, 0.4 on a 1-5
  mood, 10% of what you usually eat.
- A **Welch t-test** has to clear |t| ≥ 2: roughly, the gap is unlikely
  to be noise given how much the days vary.
- Only the strongest insight per outcome is kept. Three ways of saying
  "you keep more habits when…" is one finding.

With a fresh account, that means an empty screen that says what to log to
see more. That's the correct answer. It isn't a bug.

## Correlation, said out loud

"You kept 92% of your habits after 7 h+ of sleep, against 42% on shorter
nights" doesn't mean sleep caused it. A calm week could cause both. The
app says so under every list of insights, and it calls them hints worth
testing, not findings.

## Why not just use a model?

A model is better at prose. It's worse at the one thing this feature is
for, which is being right about _you_. The t-test is fifty lines anyone
can read in `app/insights/engine.py`. Every number it shows can be checked
against your export.
