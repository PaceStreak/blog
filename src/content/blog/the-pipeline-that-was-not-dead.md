---
title: "The monitoring pipeline that was not dead"
description: "A confident diagnosis that turned out to be a stale local clone 719 commits behind, and the one command that would have prevented it."
date: 2026-09-23T09:00:00Z
tags: ["status", "git", "lessons"]
---

PaceStreak's status page runs on Upptime: GitHub Actions check each site on a
schedule and commit the results to the `status` repository, which builds the
page. One day the data looked stale, and the diagnosis came quickly and
confidently: the monitoring pipeline had stopped.

It had not. The local clone was **719 commits behind** origin.

## How it went wrong

Upptime commits constantly, because every check that changes a response time
or a status is a commit. A local clone that has not been pulled for a while
falls behind fast. Reading the history files in that clone showed the last
results it knew about, which were old, so everything looked frozen.

Every step of the reasoning was sound. The input was wrong.

## The fix

```bash
git pull
```

After that, the data was current and the pipeline had been running happily
the whole time.

## What we changed

The correction is now written down in the project notes, next to the claim it
corrects, with the rule: **check `git pull` before diagnosing staleness.** It
sits beside another correction of the same shape, a confident "this is
impossible" about Cloudflare Pages that turned out to be a setting.

Both have the same lesson. The most expensive mistakes are not the uncertain
ones, which get checked. They are the confident ones, which do not. When a
diagnosis rests on local state, confirm the local state first.
