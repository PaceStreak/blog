---
title: "Astro ate the space before our email address"
description: "Shipping 'Write tohello@pacestreak.com' three times, and the build check that finally stopped it."
date: 2026-09-21T15:00:00Z
tags: ["astro", "bugs", "web", "testing"]
---

Three separate times, the PaceStreak website shipped a footer that read:

> Write tohello@pacestreak.com

Each time it was fixed. Each time it came back.

## Why the space disappears

In the template the text looked like this:

```astro
Write to
<a href="mailto:hello@pacestreak.com">hello@pacestreak.com</a>
```

The line break between "to" and the link is whitespace, and in plain HTML
whitespace between text and an inline element collapses to one space. Astro's
compiler, though, trims whitespace around line breaks in some positions. The
space between "to" and `<a>` was removed at build time, and the rendered
words ran together.

It is easy to miss because the source is correct to the eye, and the page in
a browser only looks wrong if you read the footer closely.

## Fixing the bug class, not the instance

Fixing the third one by hand would have been the same mistake a fourth time.
Instead, the site's build now runs `check-html.py` over the output, and it
fails the build when a word runs directly into a link or other inline element
without a space.

The check has one subtlety. Footer links are sometimes separated by a
`·` drawn in CSS, and a typed `·` there would be a bug. In prose, a typed `·`
is perfectly correct. So the separator rule is scoped to footer containers on
purpose, and the whitespace rule runs everywhere.

## The lesson

A bug that returns is telling you the fix was in the wrong place. The source
of this one was a compiler behaviour that will not change, so the guard went
where it can see every future instance: the built HTML.
