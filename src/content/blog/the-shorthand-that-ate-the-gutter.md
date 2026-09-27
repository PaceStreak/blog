---
title: "The shorthand that ate the mobile gutter"
description: "How one padding declaration silently removed the side margin on phones, and why padding-block is the habit now."
date: 2026-09-20T15:00:00Z
tags: ["css", "bugs", "web"]
---

The layout container on PaceStreak's sites is a class called `.wrap`. It
centres the content and gives it an inline padding, the gutter that stops
text touching the edge of a phone screen.

Then a section needed more vertical space, and got it like this:

```css
.section { padding: 4rem 0; }
```

On a desktop nothing changed, because the container is narrower than the
screen and centred. On a phone, the text in that section ran edge to edge.

## What happened

`padding` is a shorthand. Writing `padding: 4rem 0` does not mean "add
vertical padding"; it means "set all four sides", and the left and right
sides are set to `0`. When that class sits on the same element as `.wrap`,
it resets the gutter the container relied on.

The mistake is invisible in review because the line looks like it only
touches the vertical axis, and invisible on a laptop because the gutter is
only visible when the screen is narrow.

## The fix

Say only what you mean:

```css
.section { padding-block: 4rem; }
```

`padding-block` sets the top and bottom and leaves the inline sides alone.
There is also `padding-inline` for the other axis. These logical properties
are well supported and have the extra benefit of following writing direction.

## Why it is written down

This one happened more than once. That makes it a class of bug, not an
accident, and classes of bug get a line in the project notes: inside `.wrap`,
never use the `padding` shorthand. Check any layout change at phone width
before it ships.
