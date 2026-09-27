---
title: "The API is live, and deploys itself"
description: "The API's hosting decision is made: a free-tier GCP VM, Neon and Upstash, zero-downtime rolling updates on a single-node Swarm - and why the VM pulls its own updates instead of GitHub Actions pushing them."
date: 2026-09-27T18:00:00Z
tags: ["api", "infrastructure", "security", "deployment"]
---

The [last status report](/posts/where-pacestreak-is-now) left one thing
unresolved: where the API runs. That's decided now, and live at
`api.pacestreak.com`.

## The stack

A GCP `e2-micro` - the Always Free tier's one instance - running the API and
worker in Docker containers. Postgres and Redis are not containers on that
box: an e2-micro has about 1GB of RAM, and a database, a cache, the API and
the worker all fighting over that left no headroom for any of them. Postgres
is [Neon](https://neon.tech) (serverless, scales to zero); Redis is
[Upstash](https://upstash.com) (`rediss://`, TLS). Photos moved to Cloudflare
R2 a while back for the same reason a Postgres `LargeBinary` column was always
going to be wrong for this - see the [R2 migration](/posts/every-choice-in-the-stack)
if you want that story.

Ingress is a Cloudflare Tunnel, not a reverse proxy with an open port.
`cloudflared` runs as a container next to the API, reachable only by service
name on the overlay network - nothing binds to the VM's network interface at
all. `dig api.pacestreak.com` resolves to Cloudflare's anycast IPs like every
other hostname on this domain; there is no public inbound port anywhere on
that machine.

## Zero-downtime, on a single VM

One instance sounds like it should mean "briefly down on every deploy." It
doesn't, because the VM runs a single-node Docker Swarm rather than plain
Compose. Swarm's rolling update starts the new container, waits for its
healthcheck to pass, and only then stops the old one - the overlay network's
routing mesh never sends traffic to a task that hasn't passed its healthcheck.
`cloudflared` never sees a gap.

## The part we got wrong first, and un-wrote

The first plan had GitHub Actions build the image, then SSH into the VM over
a key that could run nothing but one forced deploy script, and update the
running service itself. It's a defensible design - a leaked key can't open a
shell, only run that one command - and it's what a lot of "zero-downtime CI
deploy" writeups describe.

It's also a second thing to get right for no real benefit here: this org
already keeps no deploy tokens in any other repository (Cloudflare Pages
builds are Git-connected, not Actions-triggered), and adding one just for this
VM would be the only exception. So the actual answer is simpler: **GitHub
Actions only builds and pushes the image.** There is no credential in this
org's Actions secrets that can reach the VM at all, in either direction.

The VM decides for itself, on a two-minute systemd timer: pull
`ghcr.io/pacestreak/api:latest`, compare its digest against what's currently
running, and roll out the difference with the same start-first Swarm update
described above. Pinned to the resolved digest rather than the mutable
`:latest` tag, because Swarm only re-checks an image reference when the
reference itself changes - re-applying `:latest` verbatim on a later restart
would silently do nothing. The unit files live in the repo
(`api/deploy/gcp/`), not just on the machine, so what's running is what's
reviewable.

The trade That's not free: a change takes up to two minutes to reach
production instead of landing the second CI finishes, and pull-based means
there's no single event to point at and say "that's when it deployed" - you
read a log line instead of a CI run turning green. For a one-person, one-VM
project neither of those costs anything real, and the credential that
disappears is one this project would otherwise be carrying purely so a deploy
could happen a few minutes sooner.

## Verification and reset move to codes

One more change landed alongside the deploy work: email verification,
password reset and email-address changes now email a 6-digit code instead of
a clickable link. A link only works if you open it from the same device or
browser context you're signed in on, or aren't signed in yet, and it breaks in
exactly the situations people actually hit it in - reading a signup email on a
phone while signing up on a laptop, a mail client that pre-fetches links and
silently spends them, a corporate scanner that clicks every URL in every
inbound email before a person ever sees it. A code you read and type has none
of those failure modes.

The code is checked differently than the token it replaces, on purpose: a
32-byte link token is unique enough to look up by itself, but a 6-digit code
is not - two people can get `042817` on the same day, and the database has to
expect that rather than pretend it can't happen. Lookup is by account and
purpose first, the code checked against that row second, and five wrong
guesses invalidate it - a deliberately short leash for something with this
little entropy compared to what it replaced.

## What's still open

Same list as before, minus the item this post just closed. `app.pacestreak.com`
still has no DNS record, on purpose, until there's a real deployment to attach
it to. Backups are configured but the restore path wants another real test.
And the credentials that got typed into a chat window while setting any of
this up are being treated as already compromised and rotated, on the
assumption that "probably fine" is not a security posture.
