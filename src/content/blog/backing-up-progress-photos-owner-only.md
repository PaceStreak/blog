---
title: "Backing up progress photos, owner-only"
description: "Progress photos used to live only on the phone. Now they can be backed up to the account, opt-in, with the bytes checked, never cached, and deleted everywhere when backup is turned off."
date: 2026-09-26T18:00:00Z
tags: ["privacy", "api", "photos"]
---

Body progress photos in PaceStreak were deliberately device-only: no upload
path existed. That had a real cost. A new phone, or clearing the browser, and
they were gone. So photos can now be backed up, if you turn it on.

## Opt-in, per device

Backup is a switch next to the photos, off by default. Turning it on uploads
what's on the phone and downloads what's already in the account. Turning it off
asks first, then deletes **every** copy on the server. The phone keeps its own.

## What the server accepts

- **Images only, checked by their bytes.** The declared `Content-Type` must be
  JPEG, WebP or PNG, and the first bytes must match it. An SVG claiming to be a
  JPEG is refused.
- **2 MB each, 500 in total.** The app re-encodes to a 1600px JPEG first, which
  lands far under the cap.
- **Client-chosen ids.** A retried upload replaces rather than duplicates, and
  an id that belongs to someone else is refused without saying whose.

## What the server returns

Photos are served only to their owner with `Cache-Control: private, no-store`,
so no shared cache or CDN ever holds a copy. Nothing about them reaches a feed,
a profile or a leaderboard.

## Location data

Before a photo is saved anywhere, the app redraws it through a canvas. That
drops the camera's EXIF metadata, including where it was taken. The server
never sees the original file.

## Export

Backed-up photos are included in the CSV export under `photos/`, so they leave
with you like everything else.
