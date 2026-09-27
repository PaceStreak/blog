---
title: "The bolt comes back"
description: "Why the calendar-and-X logo was replaced by the original lime bolt, and why a mark has to survive being sixteen pixels wide."
date: 2026-09-27T01:50:00Z
tags: ["design", "brand", "svg"]
---

The wall calendar redesign also brought a new logo: a small calendar page
with a marker X across it. When the lime palette returned, the calendar mark
stayed for a few hours, and the first question on seeing the app was simple:
why is there an X in the top left?

It is a good question. An X in a corner means "close" to almost everyone.
Inside the app the X is our "done" mark, but a logo is read before anyone has
learned the app's vocabulary.

## The original mark

PaceStreak's mark was a lime lightning bolt, and it is back everywhere: the
app's sidebar, the website header and footer, the favicons, the install
icons and the images drawn for social cards.

It is one path:

```svg
<path d="M39 5 8 39h19L25 59 56 25H37L39 5Z" />
```

Six points. On the product's dark ground it is drawn on its own in lime.
As a favicon it is knocked **out** of a lime tile rather than drawn on top of
one, because a layered or stroked mark turns to mush at 16 pixels while a
silhouette survives.

## Why the calendar mark lost

The calendar page had four separate parts: a page, a header strip, two
binding rings and the X. At the size of a browser tab those parts merge into
a grey smudge with a coloured stripe. It also said the same thing as the
week board sitting right beside it, so it added nothing.

The bolt says something the rest of the interface does not: pace, energy,
momentum. And it is the mark people who have seen PaceStreak before already
know.

## One source of truth

The social images are drawn by a Python script, so it now draws the bolt
from the same six points as the SVG. If the mark ever changes again, it
changes in the SVG and in that one list of coordinates, and nowhere else.
