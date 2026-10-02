---
title: "Keyboard first, and thumb first"
description: "A command palette, G-then-a-letter shortcuts, swipe and long-press on habits, pull to refresh, and why each one is a shortcut on top of a button rather than the only way in."
date: 2026-10-02T12:00:00Z
tags: ["app", "accessibility", "design"]
---

This round of the app was about saving seconds on things done every day.
There was one rule throughout: **every gesture and shortcut is a faster way
to do something a button already does.** Nothing is reachable only by
swiping or only by a key.

## The palette

Ctrl or ⌘ K (or `/`) opens a palette. It lists:

- every screen
- actions like logging a session or opening the trash
- your habits still open today, so typing "wat" and Enter ticks Water
- with two or more letters, results from searching everything you've
  logged

It follows the WAI-ARIA combobox pattern: the input owns a listbox,
`aria-activedescendant` tracks the highlighted option, and arrow keys,
Enter and Escape work as a screen reader expects. Matching is
word-start: "write jour" finds "Write in the journal".

`G` then a letter jumps to a screen: H for habits, F for food, J for
journal, and so on. `?` lists them all. Shortcuts are ignored while you're
typing in a field or a sheet is open.

## Swipe and long-press

Swipe a habit right to complete it, or left (or long-press) to set the
exact amount. The gesture only starts once movement is clearly sideways
(one and a half times more horizontal than vertical), so scrolling a list
never ticks anything, and vertical scroll stays native with
`touch-action: pan-y`. A coloured strip shows what the swipe will do
before you let go.

Habits being broken get no gestures at all. Logging a slip should never be
one stray thumb movement.

## Pull to refresh, only where it belongs

In a browser tab, the browser already has pull-to-refresh, and two would
fight. So PaceStreak's runs only in the installed app. It syncs this
device's changes first, then refetches what's on screen without reloading,
so a half-written note survives.

## Remembered, per device

Text size, a compact layout (one CSS variable, Tailwind's `--spacing`,
tightens every gap at once) and high contrast are per device, because a
phone and a laptop want different things. Screens also remember their last
tab, ignoring a stored value that no longer exists.
