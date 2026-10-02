---
title: "Emailing you your own data, carefully"
description: "The monthly backup email can now carry the export itself. It was held back for a privacy reason, then built behind a second opt-in with a plain warning. Here's the trade-off and how it's guarded."
date: 2026-10-02T13:00:00Z
tags: ["privacy", "data", "product"]
---

The monthly backup email used to be a reminder with a link into the app.
That was deliberate, and written into the code: the email "carries a link
into the app, never the data". Putting the export in an email means every
habit, including ones someone is quitting, plus weight, food and journal
entries, sitting in an inbox. Mail is forwarded, searched by its provider,
and exposed if the email account is compromised.

People asked for the file anyway, and it's their data. So it now exists,
built to be chosen knowingly rather than drifted into.

## A second opt-in, with the warning in words

The backup email itself is opt-in. Attaching the data is a **separate**
switch, off by default. Turning it on opens a confirmation that says what
will be in the email and who can read it, in plain words, before anything
changes. Turning it off is one tap.

## What arrives

On the 1st, a zip of the same JSON the in-app export produces. It imports
straight back into PaceStreak, and the tests check exactly that round trip.

There's no download link and no token, so a forwarded email can't fetch
anything later; what's in it is all there is. If an export grows past
10 MB, that month falls back to the link, rather than bouncing off a
mailbox limit.

## A bug found on the way

The settings call that turns this on sends one category's channels. The
server used to **replace** all channels with what it was sent, so changing
one switch reset every other one to its default. The existing settings
screen hid that by always sending everything. Updates now merge per
category and channel, and a test holds it there.
