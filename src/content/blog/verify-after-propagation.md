---
title: "Verify after propagation, not after push"
description: "A redirect was reported broken seconds after pushing. It simply was not live yet. How we check deploys now."
date: 2026-09-26T15:00:00Z
tags: ["cloudflare", "deployment", "lessons"]
---

PaceStreak's website has a short redirect, `/twitter`, that points at the
project's profile. After a push that added it, the redirect was checked
straight away, did not work, and was reported as broken.

It was not broken. It was not deployed yet.

## How deploys work here

Pushing to `main` deploys. The website and the blog are Git-connected
Cloudflare Pages projects: a push triggers a build on Cloudflare, the build
runs `npm ci` and the site's build, and the result is published to the edge.
There is no deploy workflow of our own and no API token in either repository.

That pipeline takes time: a queue, an install, a build, and then propagation
across the edge. Checking a URL seconds after `git push` tests the previous
deployment.

## How we check now

Deployment history is readable without a token:

```bash
npx wrangler pages deployment list --project-name=pacestreak
```

The workflow is:

1. Push.
2. Watch the deployment list until the new commit appears and has finished.
3. Then request the URL, bypassing any local cache.

Only a failure at step three is a bug.

## A related trap: the edge cache

Even after a deploy, some files can be served stale from Cloudflare's cache.
The available API token can only read the zone, not purge it, so a purge is a
dashboard job. That is a known outstanding task, and it is another reason to
confirm what the edge is actually serving before drawing conclusions.

## The lesson

"It doesn't work" and "it isn't there yet" produce the same response. Tell
them apart before reporting either.
