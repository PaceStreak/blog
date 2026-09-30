---
title: "A status page that watches the whole stack, finally"
description: "app and api had no DNS records for most of their existence, so there was nothing to monitor - which meant status.pacestreak.com kept quietly not telling the whole story even after both went live. Fixed, plus a lesson in why a 200 from the app proves nothing about the API behind it."
date: 2026-09-27T20:39:45Z
tags: ["infrastructure", "status", "cloudflare", "monitoring"]
---

`status.pacestreak.com` has watched `www.pacestreak.com` since the
beginning, because that was the only thing that existed to watch. `app` and
`api` had no DNS records for most of this project's life - deliberately,
per the rule that a proxied record with nothing behind it returns a 522,
which reads to a visitor as a broken product, strictly worse than not
resolving at all. No record meant no uptime check meant nothing to add to
the status page, and that stayed true right up until it wasn't: the API
went live, the app got its custom domain, and the status page kept
describing a smaller stack than the one actually running.

## Three new monitors, not two

The fix adds uptime and TLS checks for `app.pacestreak.com`,
`api.pacestreak.com`, and `blog.pacestreak.com` - the last one having been
live and unmonitored this whole time too, simply never added.

The API check hits `/health` specifically rather than the root, for two
reasons written directly into the config: it's unauthenticated and cheap -
a liveness check, not a database round-trip - so it's safe to poll every
five minutes without eating into the same per-IP rate limits real users
share, and it gives a text-content assertion (`healthy`) that's actually
meaningful rather than just "some page rendered."

The app check is the more interesting one, and it comes with a comment
worth keeping verbatim because it's the whole point:

```yaml
# The product itself: React PWA shell, served noindex. A 200 here still
# proves nothing about the API behind it, hence the separate api.
# monitor below — the app can render its shell while every API call fails.
```

A PWA shell is static. It can return 200 and render a complete, correct-
looking login screen while every single API call behind it times out -
which is exactly the kind of failure a single "is the homepage up" check is
built to miss entirely. That's the reason this isn't one monitor covering
"the product," it's three, watching three genuinely different failure
modes: the marketing site, the app shell, and the API that actually makes
the app do anything. Any one of them can be green while another is on fire,
and a status page that can't tell those apart isn't really monitoring
anything beyond "a server responded to something."
