---
title: "One session cookie across every subdomain"
description: "Why the session cookie uses __Secure- rather than __Host-, why SameSite=Lax is enough, and the rule it forces on the whole domain."
date: 2026-09-24T09:00:00Z
tags: ["security", "auth", "cookies", "api"]
---

The app will live at `app.pacestreak.com` and the API at
`api.pacestreak.com`. For the app's requests to carry the session, the
cookie has to be visible to both. That one requirement decides several
things.

## `Domain=pacestreak.com`

A cookie without a `Domain` attribute is host-only: set by the API, it would
only go back to the API's exact host. Setting `Domain=pacestreak.com` makes
it valid for every subdomain.

## `__Secure-`, not `__Host-`

Cookie name prefixes let the browser enforce rules:

- `__Host-` requires `Secure`, `Path=/` and **no** `Domain` attribute.
- `__Secure-` requires only `Secure`.

`__Host-` is the stronger lock, but it forbids exactly the attribute we need.
So the cookie is `__Secure-`, which still guarantees it is only ever set and
sent over HTTPS.

## `SameSite=Lax` is enough

The app and API are different **origins** but the same **site**: they share
the registrable domain `pacestreak.com`. `SameSite` is about sites, not
origins, so a `Lax` cookie is sent on the app's requests to the API. There is
no need for `SameSite=None`, which would also send it on requests started by
other sites and widen exposure for nothing.

## CORS names its origin

Credentialed requests cannot use a wildcard CORS origin; browsers reject
`Access-Control-Allow-Origin: *` with credentials. The API lists the app's
origin explicitly.

## The rule this imposes

A cookie scoped to the whole domain is readable by every host under it. So
**nothing untrusted may ever be hosted under `pacestreak.com`**: no
user-generated subdomains, no third-party page on a vanity subdomain. That is
the price of one cookie, and it is written down so nobody pays it by
accident.
