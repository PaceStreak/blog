---
title: "Drawing a marker X in two strokes of SVG"
description: "The signature interaction of the redesign is a hand-drawn X that draws itself when you tick a day. It's two SVG paths, one CSS keyframe and a pathLength trick, with no JavaScript animation at all."
date: 2026-09-27T10:00:00Z
tags: ["design", "svg", "css", "motion"]
---

When you tick a habit in PaceStreak, a marker X draws across the date. It
should feel like a hand did it: two strokes, the second starting just after the
first, slightly uneven.

## Two paths, not a glyph

A `×` character is a font's idea of a cross: symmetrical, perfectly straight,
and it can't be animated stroke by stroke. So the X is two cubic Bézier paths
in a 40×40 box, each bowing a little, one longer than the other:

```html
<svg viewBox="0 0 40 40">
  <path pathLength="1" d="M8.5 9.5c6.5 5.4 15 13.2 23 21.8" />
  <path pathLength="1" d="M31.5 8.8C24 15 16.4 22.3 8.8 31" />
</svg>
```

## `pathLength="1"` does the maths

The classic line-drawing trick sets `stroke-dasharray` to the path's length and
animates `stroke-dashoffset` from that length to zero. The catch is that you
need the length, and it differs per path.

`pathLength="1"` tells the browser to treat the path as one unit long, whatever
its real length. Then the CSS is the same for every stroke:

```css
.marker-stroke {
  stroke-dasharray: 1;
  animation: marker-draw 150ms cubic-bezier(0.3, 0.6, 0.2, 1) both;
}
.marker-stroke-2 { animation-delay: 120ms; }
@keyframes marker-draw { from { stroke-dashoffset: 1; } }
```

The second stroke waits 120ms, so the whole mark takes about a quarter of a
second: fast enough never to be in the way, slow enough to register.

## Round caps and a faded numeral

`stroke-linecap: round` makes the ends look like felt tip rather than a ruler.
The date numeral underneath fades to 35% when marked, so the date stays
legible under the ink instead of turning to mush.

## Reduced motion

The app's global reduced-motion rule shortens every animation to almost zero.
The mark still appears; it just doesn't draw. The settled state is the correct
one, which is also why screenshots of it come out clean.

## Why not a library

The whole effect is two paths and nine lines of CSS. It runs under a
`default-src 'self'` Content Security Policy with no inline scripts, costs
nothing at runtime, and works the same in the app and on the marketing site,
where the hero calendar uses the identical paths.
