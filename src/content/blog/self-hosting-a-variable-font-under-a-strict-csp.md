---
title: "Self-hosting a variable font under a strict CSP"
description: "PaceStreak's Content Security Policy allows nothing from other origins, so the new typeface had to ship with the app. Archivo's width axis turned out to be the whole reason to choose it."
date: 2026-09-27T11:00:00Z
tags: ["design", "csp", "fonts", "performance"]
---

Every PaceStreak site ships `default-src 'self'`. There's no font CDN, no
hosted font link, nothing fetched from another origin. That rules out the usual
one-line font embed, and it's the right constraint: a font request to a third
party tells that party who's reading.

## Choosing the face

The redesign wanted printed-calendar numerals: heavy, narrow, tabular. Most UI
faces only give you weight. Archivo is a variable font with **two** axes,
weight (100–900) and width (62%–125%), so one file covers:

- body text at normal width,
- headings slightly narrowed (`font-stretch: 88%`),
- dates and counts condensed (`font-stretch: 70–82%`), like a planner.

One family, one download, and the "calendar numeral" isn't a second font.

## Shipping it

`@fontsource-variable/archivo` packages the font as npm files. Importing its
width-axis stylesheet puts the `@font-face` rules and the `woff2` files into
the Vite and Astro builds, served from our own origin:

```css
@import "tailwindcss";
@import "@fontsource-variable/archivo/wdth.css";
```

The stylesheet splits the font by `unicode-range`, so a reader of English pages
only downloads the Latin subset.

## The trap that was already fixed

Vite inlines small assets as base64 `data:` URIs by default. Under our CSP a
`data:` font would silently fail to load. That was already handled for images
with `assetsInlineLimit: 0`, which is load-bearing here too: every font file is
a real file with a real URL on our own origin.

## Numbers that line up

Every number in the app is a date, a count or a measurement, so `.num` uses
`font-variant-numeric: tabular-nums` along with the condensed width. Columns of
numbers line up without a monospace font, which would have been a costume.
