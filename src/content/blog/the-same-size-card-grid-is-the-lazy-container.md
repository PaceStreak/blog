---
title: "The same-size card grid is the lazy container"
description: "'How it works' and 'Principles' were both an icon-heading-text grid, identically sized, in the exact way any landing page's craft floor flags as the default nobody actually chose. Replaced with two compositions that carry real information in their shape."
date: 2026-09-27T12:26:21Z
tags: ["web", "design", "css"]
---

Two sections on `www.pacestreak.com` had quietly become the same
component - "How it works" on the homepage, and "Principles" on the About
page - despite having nothing to do with each other. Both were an
icon-plus-heading-plus-text card, repeated three or six times, all sized
identically in a grid. That shape is the thing a landing page reaches for by
default when nobody's decided what the section should actually *look* like,
and it's worth naming precisely because it's invisible once it exists: it
doesn't look broken, it looks like every other site's features section,
which is exactly the problem.

## Giving each one a shape its content earns

"How it works" became a torn-week strip: three consecutive dates -
Monday, Wednesday, Friday - joined by a connecting rule, ending in the
marker X. That's not a new motif invented for this section; it reuses the
tear-off date block and two-stroke marker that already run through the rest
of the site. The point isn't three unrelated steps in three equal boxes,
it's one ritual repeated across a week, and the composition now says that
before anyone reads the copy.

"Principles" became a ruled two-column list, borrowing the same `<dl>`
treatment already used on the features page, replacing six identically
bordered cards:

```diff
-<div class="mt-8 grid gap-6 sm:grid-cols-2">
-  {principles.map((principle) => (
-    <article class="card">
-      <h3 class="text-lg font-semibold">{principle.title}</h3>
+<div class="mt-2 grid sm:grid-cols-2 sm:gap-x-10">
+  {principles.map((principle) => (
```

Six cards all reads as "six equally important, equally sized things" -
correct information, wasted layout, since a grid can't distinguish a
principle worth dwelling on from one that's a single line. A ruled list
carries hierarchy for free.

## One scroll motion, applied once

This also shipped the site's first considered scroll animation: a single
`[data-reveal]` system - one eased transform-plus-opacity transition, staggered
per element via CSS custom properties rather than inline styles (which the
CSP would silently block anyway), gated behind a `.js` class so it's
progressive enhancement, not a requirement. Fully inert without JavaScript,
and fully inert under `prefers-reduced-motion`. Applied consistently across
the homepage instead of accumulating as one-off effects per section, which
is the version of "add some motion" that tends to age into a pile of
slightly different easing curves nobody can account for later.

Nothing about the palette, the brand mark, or the copy changed here - this
was purely two sections' shapes, done once, in a way the rest of the site
was already speaking.
