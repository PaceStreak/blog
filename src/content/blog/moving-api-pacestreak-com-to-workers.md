---
title: "Moving api.pacestreak.com to Workers, and what the plan limits mean"
description: "On 19 October the API's hostname moved from FastAPI Cloud to a Cloudflare Worker. How the swap avoided a 522, why the code is written to limits higher than the plan it runs on, and where the Python service went."
date: 2026-10-19T15:00:00Z
tags: ["infrastructure", "cloudflare", "deployment", "api"]
---

On 19 October `api.pacestreak.com` stopped pointing at the Python service
on FastAPI Cloud and started pointing at a Cloudflare Worker. The app needed
no change: same API host, same storage host, so its Content Security Policy
was already right. This post covers how the swap was done, the limits the
Worker runs under, and what happened to the old code.

## A runbook before the switch

The cutover was written up as a numbered runbook before anything was
created. Every step has a **check** (how you know it worked) and a
**rollback** (how to undo it), and nothing before the domain swap touches
production traffic. The steps:

- Create the D1 database with an APAC location hint. The hint can only be
  given at creation; it isn't a config field.
- Create the queues and their dead-letter queues, and the R2 buckets.
- Set the secrets.
- Deploy the Worker on its `workers.dev` address, with no route.
- Check it there: sign up, sign in, reload, log a habit.

Migrations are applied before every deploy and have to stay backward
compatible, because the old code briefly runs against the new schema.

## The swap, without a 522

One of our standing rules is never to create a DNS record ahead of a
deployment. A proxied Cloudflare record with nothing behind it returns a
**522**, which looks like a broken product. The old hostname was a DNS-only
CNAME to FastAPI Cloud, plus validation records. A Workers custom domain
needs the name to be free first.

So the order was:

1. Remove the domain from FastAPI Cloud.
2. Delete the CNAME and its validation records.
3. Deploy straight away, with the custom domain in the Worker's config.

Wrangler attaches the domain to the running Worker and creates the proxied
record and the edge certificate itself. In the seconds between steps 2 and
3, the name didn't resolve. That shows up as a fetch error, not a 522, and
it was acceptable with no real users. A zero-gap swap isn't possible here,
because one name can't point at two places at once.

Then, as always, we [verified after propagation](/posts/verify-after-propagation),
not seconds after deploying.

## The plan, as engineering constraints

The Worker runs on Cloudflare's **Workers Free** plan today. The code was
designed for the higher Workers Paid limits, and it doesn't branch on
which plan it is on. The limits that matter:

|                               | Free          | Paid            |
| ----------------------------- | ------------- | --------------- |
| CPU per request               | 10 ms         | up to 5 minutes |
| D1 queries per invocation     | 50            | 1,000           |
| D1 Time Travel restore window | 7 days        | 30 days         |
| Email Service sending         | not available | included        |

Here is how each one shapes the code:

- **CPU.** Sign-in hashes the password with PBKDF2 at 100,000 iterations,
  the maximum Workers allows. Live sign-in works within the Free limit
  today. If it ever stops fitting, the error is a clear `1102`. The answer
  then is a bigger CPU allowance, never fewer iterations.
- **Queries per invocation.** Background jobs run as queue messages, one
  message per invocation. Each message is sized to stay under 90% of the
  1,000-statement limit, and a test measures it. Under the lower cap, a
  heavy job can fail, retry and land in the dead-letter queue. That's
  visible and recoverable, not silent.
- **Restore window.** The 7-day window is part of why we added a [nightly
  off-host copy](/posts/a-backup-that-lives-somewhere-else).
- **Email.** Cloudflare's Email Service can't send to arbitrary addresses
  on this plan, so mail goes over SMTP from the Worker. That has [its own
  post](/posts/email-you-can-trust).

Moving to the higher limits is a plan change and one line in
`wrangler.jsonc`, the CPU limit, which the Free plan refuses. Nothing else
in the code changes.

## The old service, kept

The TypeScript code was built on the `next` branch and merged into `main`,
so `main` holds the code that's actually serving. The Python service lives
on as a branch called **`old`**. Nothing deploys it. It's there as a working
reference and a way back. The scheduled GitHub Actions worker and the
migration workflow went with the Python tree. Background jobs now run on the
Worker's own cron triggers, so there is one scheduler, not two.
