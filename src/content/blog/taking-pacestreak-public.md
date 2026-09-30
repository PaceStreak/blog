---
title: "Taking PaceStreak public: replacing the waitlist"
description: "Every 'Get early access' and waitlist surface on the site now points at a real sign-up, because there's a real app behind it to sign up for."
date: 2026-09-27T21:06:33Z
tags: ["web", "product", "launch"]
---

Every "Get early access" button on `www.pacestreak.com` used to lead to an
email field and a promise. As of today it leads to
[app.pacestreak.com/signup](https://app.pacestreak.com/signup), because
there's an account behind that link now, not a waitlist.

This wasn't a big decision so much as a fact catching up with the site. The
API went live two days ago, Turnstile is guarding signup against abuse, OTP
codes replaced magic links, and the last of the dead-end auth bugs got fixed
yesterday. The marketing site was the one piece still describing a product
that hadn't opened yet, and an inaccurate site is worse than an honest one.

## What actually changed

Every waitlist surface across the site - the hero, the nav, the footer, the
features page, the about page, and the section that used to be
`#waitlist` - now points at real sign-up and sign-in links instead of an
email capture form. That's the visible part.

The less visible part is everywhere else the "not open yet" framing had
quietly baked itself in:

- The changelog's `released` flag flips from `false` to `true`, which drops
  the banner telling readers the product isn't available.
- `/privacy` drops the "not open to the public yet" paragraph and, more
  importantly, drops a claim that stopped being true the moment Turnstile
  shipped on the app: that the sites and app "load nothing from third
  parties." They don't - not without exception - and a privacy policy that
  says so anyway is the specific kind of small inaccuracy this site's own
  rules exist to catch. The service-providers section now names Cloudflare
  R2 and Turnstile, GCP, Neon, and Upstash explicitly instead of describing
  them vaguely as "to be named."
- `/features` and `/faq` drop "not open to the public yet" language in favor
  of describing what happens when you actually sign up.

## What didn't change

No pricing. There still isn't a plan, and pricing language was removed from
this site once already for exactly that reason - it doesn't come back until
there's something real to say about it.

Nothing about the product itself changed today. This was entirely the site
telling the truth about work that had already shipped.
