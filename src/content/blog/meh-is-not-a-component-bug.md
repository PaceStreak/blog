---
title: "\"Meh\" is not a component bug"
description: "Fixing the same-size card grids made the site more correct and no less forgettable. The actual complaint was about the whole page, not a pattern - which meant the fix had to be a hero, motion and rhythm pass, not another round of component surgery."
date: 2026-09-27T12:33:13Z
tags: ["web", "design", "css"]
---

The [card-grid fix](/posts/the-same-size-card-grid-is-the-lazy-container)
replaced two identical-looking sections with compositions that actually
carry information. It was a correct fix, applied precisely, and the site
still read as "meh" afterward - because that was never a component-level
complaint. Nobody was pointing at "How it works" specifically. They meant
the whole page, and the whole page needed a different kind of attention than
finding and replacing one lazy pattern.

## Four things, all within the locked palette

Nothing about the lime, near-black, or brand mark changed here - all of it
stayed inside the marks that were already locked. What changed was how much
weight those marks were given room to carry.

**The hero** went from a generic headline-over-card layout to something
with an actual first impression: editorial type scaled up via `clamp()` to
6rem, a dateline device tied into the calendar motif rather than a floating
label, a faint graph-paper rule pattern behind it, and an oversized ghost
numeral bleeding behind the demo card. That last one is doing the most
work - a huge, barely-visible number behind the product shot is the
difference between "here's a card" and "here's a page with presence," at
the cost of nothing structural.

**Motion** went from one fade-up transition reused everywhere to three
distinct entrances chosen for what each thing actually is: the ritual strip
tears in like a physical page coming off a pad, the week board unfolds from
its top edge like something being opened, and the hero's calendar card
drops and settles on page load rather than waiting on a scroll trigger -
because it's above the fold, so making it wait for scroll would mean most
visitors never see it animate at all.

**Micro-detail**: a themed scrollbar instead of the browser default, an
animated underline on nav links, a hover twist on the feature planner's
marker-X box. None of these are load-bearing. All three are the kind of
thing that doesn't show up in a written spec and is exactly what separates
a site that feels considered from one that technically works.

**Rhythm**: section padding stopped being a uniform `py-20`/`py-24`
everywhere - varying it by what each section actually needs gives the page
a pulse instead of a metronome, and About and Features picked up the same
fluid type scale the hero got, so the editorial feel doesn't stop at the
homepage's fold.

## The lesson in having two separate commits

The [previous post](/posts/the-same-size-card-grid-is-the-lazy-container)
and this one are twenty minutes apart and both real, necessary work - but
they're different *kinds* of work, and conflating them would have meant
either shipping the pattern fix late while chasing vibes, or shipping vibes
on top of a structurally lazy layout. Fix what's mechanically wrong first,
verify it's actually fixed, and only then ask whether the result is any
good - because "is this good" is a much harder question to answer honestly
while a known, nameable defect is still sitting in the page.
