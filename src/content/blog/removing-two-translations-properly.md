---
title: "Removing two translations, properly"
description: "PaceStreak had German and Spanish catalogues. They're gone now. Removing a language isn't deleting two files: it's the picker, the stored preference, the tests and every place that assumed more than one."
date: 2026-09-26T09:00:00Z
tags: ["i18n", "app"]
---

PaceStreak had shipped German and Spanish translations of the app. They were
unreviewed by native speakers and falling behind every time a screen changed.
A translation that's half right is worse than none: it tells the reader the
product cares about their language, then proves it doesn't. So they were
removed.

## What "remove" actually touched

Deleting the two catalogue files was the smallest part:

- **The language picker** in settings went, since one option isn't a choice.
- **Stored preferences.** Anyone who had picked German or Spanish had that
  saved; the app now falls back to English without an error.
- **The sign-in screen** had a language switcher of its own.
- **Tests.** The i18n guard checked that every key existed in every catalogue;
  it now checks the one catalogue has every key the code uses.
- **The build.** No more per-language chunks.

## What stayed

The i18n layer itself stayed. Strings still go through one function with
plural rules and interpolation, so adding a language later is a catalogue and a
review, not a refactor. Taking the languages out didn't mean taking the door
out.
