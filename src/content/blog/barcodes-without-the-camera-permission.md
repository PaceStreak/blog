---
title: "Scanning barcodes without the camera permission"
description: "The app's Permissions-Policy says camera=(). Barcode scanning shipped anyway, by reading a photo instead of a video stream, and the lookup sends the barcode and nothing else."
date: 2026-10-01T12:00:00Z
tags: ["app", "nutrition", "privacy", "security"]
---

Every barcode-scanning tutorial starts with `getUserMedia`: open the
camera, stream frames, decode each one. PaceStreak's app headers include
`Permissions-Policy: camera=()`, which forbids that outright. The policy
exists because the app has never needed a camera, and a permission nobody
uses is a permission nobody should be able to abuse.

Loosening it for one feature was the obvious fix. It also wasn't needed.

## A photo is enough

A file input with `accept="image/*" capture="environment"` opens the
phone's own camera app. The picture comes back as a file. The page never
holds a camera stream, so the policy doesn't apply. The browser's built-in
`BarcodeDetector` then reads EAN and UPC codes straight from the image.

`BarcodeDetector` is Chromium-only for now. In Firefox and Safari the scan
button simply isn't shown, and typing the number into the barcode field
does the same lookup.

## The lookup, and what leaves

The app asks our API, never a third party directly, so the strict
`connect-src` stays as it is. The API checks your **saved foods first**,
so a correction you made always wins. Only then does it ask Open Food
Facts, an open, community-built database.

That request carries the barcode number and a User-Agent naming the app.
No account, no cookie, nothing about who's asking. Answers are cached in
Redis: found products for a month, misses for a day. A popular yoghurt is
looked up once, not once per person. The privacy page names Open Food
Facts as a provider, as it names everything else.

An outside answer isn't saved until you confirm it, and the sheet tells
you to check it against the label. Open data is good. It isn't infallible.
