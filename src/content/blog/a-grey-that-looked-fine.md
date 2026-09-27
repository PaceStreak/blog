---
title: "A grey that looked fine and measured 4.09"
description: "Muted text that passes the eye test and fails WCAG AA, and why contrast has to be measured against the real background, cards included."
date: 2026-09-20T09:00:00Z
tags: ["design", "accessibility", "css"]
---

Every dark interface has a muted grey for secondary text: dates, hints,
labels. PaceStreak's was `#71717a`, and it looked fine. It looked like
exactly the right amount of quiet.

It measured **4.09:1** against the page background. WCAG AA asks for 4.5:1
for normal text. It failed, and it failed everywhere secondary text appears,
which is most of the screen.

## Why the eye lies

Contrast perception depends on what surrounds the text, how large it is and
how bright the room is. On a good monitor in a dim room, 4:1 grey on
near-black reads comfortably. On a phone in daylight, at arm's length, with a
tired pair of eyes, it does not. The designer's screen is the most flattering
place the design will ever be seen.

## The fix, and the trap inside it

The grey became `#8b8b95`, which measures **5.87:1** on the page background.

The trap is that the page background is not the only background. Secondary
text also sits on cards, which are a step lighter, and a lighter background
means less contrast. A grey that passes on the page can fail on a card.
So every pairing is measured against the surface it actually sits on:

- text on the page,
- text on a card,
- text on a raised element inside a card.

## The rule

Contrast is a number, not an opinion. Before a colour token changes, it gets
measured against every surface it can land on. This is now written in the
project's list of bug classes that have bitten more than once, because it
had.
