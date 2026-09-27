---
title: "A selector that flattened the activity grid"
description: "The activity grid lost its colours because a two-part selector outranked the level classes. A short tour of CSS specificity."
date: 2026-09-21T09:00:00Z
tags: ["css", "bugs", "design"]
---

The activity grid is the heart of PaceStreak's look: a year of small squares,
each coloured by how much happened that day. One day every square turned the
same colour.

## The two rules

The grid cells are `<i>` elements inside a `.heat` container. Each cell gets a
level class, `.lvl--0` to `.lvl--4`, that paints its colour:

```css
.lvl--3 { background: var(--heat-3); }
```

Someone (reasonably) wanted a default colour for cells, and wrote:

```css
.heat i { background: var(--heat-0); }
```

## Why the default won

Specificity is compared as a tuple: IDs, then classes, then elements.

- `.lvl--3` is one class: **0-1-0**.
- `.heat i` is one class and one element: **0-1-1**.

`0-1-1` beats `0-1-0`, whatever order the rules appear in. So the "default"
overrode every level, on every cell, all the time.

## The fix

`.heat i` now sets no `background` at all, deliberately, with a comment saying
why. Cells are painted only through the level class, and `.lvl--0` is the
empty state. There is one way to colour a cell, so there is nothing to
conflict.

## The general lesson

When a descendant selector and a single class both want to set the same
property, the descendant selector will usually win, and it will win silently.
Either give one selector the job exclusively, or make the specificity
deliberate. Do not rely on source order to break a tie that is not a tie.
