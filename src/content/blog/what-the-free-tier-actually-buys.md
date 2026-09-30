---
title: "What the free tier actually buys, checked against the account"
description: "The API runs on a GCP e2-micro because that's what Always Free covers - one instance, 30 GB of standard disk, an ephemeral IP. It turns out to be sitting exactly at that ceiling, which explains more of the outage two posts back than any single bug did."
date: 2026-09-30T18:00:00Z
tags: ["infrastructure", "cloudflare", "deployment"]
---

The [outage two posts back](/posts/one-outage-four-root-causes) had four
separate causes, and every one of them was easier to have in the same hour
because the box underneath had no slack in it anywhere. That's worth
checking properly rather than asserting, so: is `pacestreak-api` actually
within Google Cloud's Always Free tier, and is there room left on it?

Checked directly against the running instance rather than against the
sales page, since the two don't always agree:

- **Machine type**: `e2-micro`, in `us-central1-a` - one of exactly three
  regions (`us-west1`, `us-central1`, `us-east1`) where an e2-micro is free.
  Outside those three regions, the identical machine type is billed
  normally.
- **Instance count**: one. The free tier covers **one** e2-micro per
  billing account, not per project, not per region within the free three -
  one, total. There's exactly one running.
- **Disk**: 30 GB `pd-standard`. The free allowance is up to 30 GB of
  standard persistent disk - not SSD, that's a different, billed tier
  entirely. This is sitting precisely at that number, not under it.
- **IP address**: ephemeral, not reserved. This matters because a *static*
  external IP is free only while it's attached to a running instance and
  starts billing the moment it isn't - so leaving it ephemeral, and letting
  DNS point at whatever address comes back, is the version that can't
  accidentally start costing money if the instance is ever stopped.
- **Not preemptible**, no snapshots accumulating storage cost in the
  background.

So: yes, genuinely within Always Free, and specifically **at** its ceiling
for compute and disk both, not comfortably under it. There's no dial to turn
up on this exact setup without leaving the free tier - the only way to add
headroom is a different, billed instance, which is a real tradeoff and not
one that's been made yet.

## Why this is worth writing down here

The instance is an `e2-micro`: one shared, burstable vCPU, 1 GB of RAM,
running Docker Swarm's manager process, the API container, a worker, a
tunnel daemon, and Google's own logging agents all at once, with nothing
held in reserve. Every distinct failure in the outage two posts back - a
swap spike taking down the tunnel, an interrupted OS upgrade needing to
finish, a database pooler needing a restart, a health-check crash loop
feeding its own contention - is the kind of thing that happens
*occasionally* on a box with room to spare, and stops being occasional the
moment the box has none. None of the four causes were caused by being on
the free tier specifically. All four were made worse, and made to happen in
the same hour instead of spread across a quieter week, by exactly how
little headroom `e2-micro` leaves for anything to go slightly wrong at the
same time as anything else.

Staying free-tier is still the right call while there's no revenue to
justify a bill against - the constraint is real and accepted on purpose.
But it's now the first item on the infrastructure list precisely because
it's the thing that turned four independent, individually minor problems
into one long afternoon.
