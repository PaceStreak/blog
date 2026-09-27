---
title: "Two repositories that are public on purpose"
description: "Everything in the PaceStreak org is private except the status page and the org's .github repo. Here is why neither should be 'fixed'."
date: 2026-09-25T20:00:00Z
tags: ["github", "infrastructure", "status"]
---

Almost every PaceStreak repository is private. Two are public, and both look
like mistakes to anyone tidying up. They are not.

## The status page

`status.pacestreak.com` is built from the `status` repository by Upptime,
served by GitHub Pages. A status page exists for the moment when everything
else is down, and it has to be readable by anyone, without logging in, from
anywhere.

A private repository cannot serve a public GitHub Pages site on the free
plan, and a status page behind a login would be useless in exactly the
situation it exists for. So `status` is public, and so is its history of
checks. There is nothing secret in it: response times and up/down states for
public URLs.

## The `.github` repository

A GitHub organisation's `.github` repository does two jobs:

1. Its `profile/README.md` becomes the organisation's public profile page.
2. Its health files (security policy, contributing guide and so on) apply by
   default to the org's **public** repositories.

Make it private and the profile page stops rendering, and the shared health
files stop applying. So `.github` is public.

## The consequence for private repositories

Shared health files never apply to private repositories, whatever the
visibility of `.github`. That is why every private PaceStreak repository
carries its own copy of `SECURITY.md`. It looks like duplication. It is the
only way the file shows up.

Both facts are now written into the project notes with the reason, because
"this repo shouldn't be public" is the sort of tidy-up that feels obviously
right until it breaks something.
