---
title: "Why app and api have no DNS records yet"
description: "A proxied DNS record with nothing behind it returns 522, which looks like a broken product. So records wait for deployments."
date: 2026-09-23T15:00:00Z
tags: ["cloudflare", "dns", "infrastructure"]
---

PaceStreak's product is built: the API and the app both exist and pass their
tests. Yet `app.pacestreak.com` and `api.pacestreak.com` do not resolve. That
is deliberate.

## What an empty record does

On Cloudflare, a proxied DNS record routes visitors to Cloudflare's edge,
which then tries to reach the origin. If there is no origin, the edge returns
a **522: Connection timed out** page, with Cloudflare's branding and the
words "the web server is not responding".

To a visitor, that does not read as "not launched yet". It reads as "broken".
A curious person who types `app.pacestreak.com` and gets a 522 has learned
that the product is down, which is worse than learning nothing. A name that
simply does not resolve is honest.

## How records get created instead

Records are never made by hand in the DNS tab ahead of time. They are created
by **attaching a custom domain to a real deployment**: in Cloudflare Pages,
adding a custom domain to a project creates the record pointing at something
that already serves content. The record and the thing it points to arrive
together.

For the API, which will run on a host that is still to be chosen, the record
will be created when that host is serving behind TLS, and not before.

## The broader rule

Do not publish a promise before you can keep it. The same idea shaped the
marketing site, which will not describe features that do not exist yet. An
address is a promise too.
