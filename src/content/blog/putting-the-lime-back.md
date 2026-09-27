---
title: "Putting the lime back"
description: "The wall calendar palette lasted a day. What we rolled back, what we kept, and why structure and colour are separate decisions."
date: 2026-09-27T01:30:00Z
tags: ["design", "app", "web"]
---

Two days ago PaceStreak changed its clothes. The near-black ground and the
lime action colour gave way to paper, black print and calendar red, on the
theory that a habit tracker should look like the thing people have always
used to track habits: a wall calendar crossed off in marker.

It lasted a day. Looked at with fresh eyes, the paper version was flat where
it wanted to be calm, and the red read as an alarm rather than a mark of
progress. "Meh and edgy" was the verdict, and it was fair.

## Colour and structure are different decisions

The useful discovery was that the redesign had bundled two changes together:

1. **A palette.** Paper, ink, red.
2. **A structure.** The Today week board, the tear-off date block, the
   two-stroke marker X as the only "done" mark, the calendar-page layout of
   the week, and Archivo as the typeface.

The palette was the part that failed. The structure was the part that worked:
the week board answers "what have I done this week?" at a glance, and the
marker X is more satisfying to earn than a tick in a circle.

So the rollback is not a revert. The tokens went back to near-black with lime
`#d3ff3e` for action and flame `#ff6b35` for the streak, and the light theme
came back with them. Everything structural stayed and was recoloured.

## What recolouring actually touched

- **Tokens first.** The app, the website and the blog each define colour in
  one place. Swapping those back did most of the work.
- **Marks.** The marker X draws in lime; habit rows each get their own marker
  colour, tuned separately for the dark and light themes so each keeps its
  contrast.
- **Images.** Social cards, share images and the blog's per-post cards are
  drawn at build time, so they had to be regenerated rather than restyled.
- **Radii.** The paper look had square corners. Cards went back to 16px and
  controls to 12px, which suits the dark ground.

## The rule we wrote down

The rejected palette is now recorded in the project notes with the reason, so
that nobody (including a future version of us with a fresh idea) brings it
back without knowing it was tried. A design decision that is not written
down gets made twice.
