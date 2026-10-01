---
title: "A journal that feeds the numbers"
description: "Daily mood and a note, a year-in-pixels grid that needs no inline styles, and why mood is the series that makes insights worth having."
date: 2026-10-01T15:00:00Z
tags: ["product", "journal", "web", "accessibility"]
---

The journal is the smallest feature in this release and the one the
others lean on. A mood from 1 to 5 and an optional line about the day.

## Why mood matters to everything else

Insights compare things you log. Training, habits, sleep and food were
already there, but none of them say how a day _felt_. Mood is the outcome
most people care about, and with it the engine can answer questions like
whether training days are better days. One tap a day is the price, so
Today shows a mood card until you've given one.

## A year in pixels, inside a strict CSP

The year view is twelve rows of up to 31 squares, coloured from flame for
a rough day to lime for a great one. The site and app ban inline styles
(`style-src 'self'`, no `unsafe-inline`), so nothing is coloured with a
`style` attribute. Each mood maps to a utility class, and Tailwind
compiles those into the stylesheet.

It's a real `<table>` with a caption and a row header per month, so a
screen reader can move through it by month and day. Colour is never the
only signal: each square's label names the date and the mood ("Mar 3:
Good"), and a legend sits underneath.

## Private like the rest

Notes are searchable, editable for the last 60 days (the same window as
habits), included in the export, and visible to nobody but you. They never
reach a feed, a group or a coach. The daily coach reads mood only as a
number, and the app shows it only to you.
