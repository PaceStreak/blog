---
title: "Three moments to ask for an install, and only three"
description: "PaceStreak held back the browser's install prompt and then hardly ever offered its own. Now it asks on the first visit, on a later day and after the first session, once each, and Settings still works any time."
date: 2026-10-02T15:00:00Z
tags: ["pwa", "product", "design"]
---

PaceStreak is a web app you can install: it opens from the home screen, works
without signal and logs a session in two taps. Until today, though, almost
nobody was told that. You had to go into Settings and find the button.

## Why the browser didn't ask

Chrome fires a `beforeinstallprompt` event when it decides a site is
installable. The app calls `preventDefault()` on it and keeps the event, so
the browser's own mini-bar never appears and the app can show the real prompt
later, at a better moment. That part is standard and right: the browser's bar
shows up on the first page load, before anyone knows what the app is.

The problem was the "later". The only automatic offer was a card on Today
that appeared after your first logged session, waited 14 days after a
dismissal, and competed with every other card for the same spot. In practice,
it rarely won.

## The three moments

There's now a small banner, above the tab bar on a phone and in the corner on
a desktop, at three moments:

1. **The first visit after signing in.** The plainest offer: what installing
   gets you.
2. **The first visit on a later day.** Coming back is the best signal that the
   app is worth a home-screen spot.
3. **Right after your first logged session.** The moment the "two taps from
   your home screen" promise means something.

Each one is shown **at most once per device**. Seeing it counts, not just
answering it, so an ignored welcome doesn't come back the next day pretending
to be new. Saying "Not now" to one doesn't cancel the others, and it also rests
the Today card for 14 days, so the same offer doesn't follow you around the
app.

It never shows when the app is already installed, when the browser can't
install it, or in the middle of a live workout.

## iPhones

Safari has no install API at all; there is nothing for a button to call. On
iOS the banner says what to do instead: *Tap Share in Safari, then Add to Home
Screen*, and its button just says *Got it*.

## Whenever you like

None of this replaces the button that was already there. **Settings → App →
Install** works at any time, and the Today card still turns up for people who
log sessions. The banners are for people who didn't know; Settings is for
people who do.
