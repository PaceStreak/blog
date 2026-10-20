---
title: "Why the API moved from Python to TypeScript on Workers"
description: "The FastAPI service worked. It also needed a host, a Postgres, a Redis, a scheduled job in GitHub Actions and a mail provider. The rewrite puts the API, the database, the queue and the scheduler on one platform, at the edge, next to the pages that already lived there."
date: 2026-10-17T12:00:00Z
tags: ["api", "infrastructure", "cloudflare", "rewrite"]
---

On 17 October we started rewriting the PaceStreak API. The old one, a
FastAPI service with about 265 routes and a pytest suite to match, was not
broken. This post is about why we replaced it anyway, and what we replaced
it with: **TypeScript on Cloudflare Workers, using Hono, Drizzle, Zod and
D1**.

## What the old API needed around it

The Python service ran on FastAPI Cloud. To work, it also needed:

- a Postgres database at Neon;
- a Redis at Upstash, for rate limits and caching;
- a worker that ran every five minutes as a scheduled GitHub Actions job,
  pulling the service's container image each time;
- a migration workflow that landed about a minute after each deploy;
- a mail provider for codes and reminders.

Each piece was reasonable alone. Together they meant environment variables
kept in two places, a scheduled job using up GitHub Actions minutes every
five minutes of every day, and a small instance that scaled to zero and paid
a cold start when it woke up. The marketing site, the blog and the app were
already on Cloudflare. The API was the one part that was not.

## The goals

We wrote the goals down before any code:

1. **One platform.** The API, its database, its background jobs, its queue
   and its file storage live in one account and deploy together. The
   scheduler is a cron trigger on the same Worker, not a separate job
   somewhere else.
2. **Fewer services.** Redis goes away entirely. Rate limits use the Workers
   Rate Limiting binding plus a counter table in D1. Caching uses the Cache
   API. Nothing needs a key-value store.
3. **The edge.** A Worker starts in the Cloudflare location nearest the
   person using it. There is no instance to wake up.
4. **Speed, measured.** Every route has a budget for how many times it may
   go to the database, and tests enforce it. The next post covers how.
5. **The code is never the bottleneck.** Whatever plan we run on, nothing in
   the code gets weaker to fit it. Passwords are hashed with PBKDF2-SHA256 at
   100,000 iterations, the most WebCrypto on Workers allows, plus a secret
   pepper. If a plan limit ever gets in the way of that, we change the plan,
   not the hashing.

## Why a rewrite and not a port

PaceStreak had no real users or data when we started, so nothing had to stay
compatible with the Python service's storage. That made this a new project
instead of a migration. We could:

- redesign the auth tables (sessions now own their refresh tokens);
- store email and recovery codes as HMACs bound to the user;
- encrypt authenticator secrets with AES-GCM, using the user id as
  associated data;
- change the API contract where the change was clearly better, as long as
  the app changed in the same piece of work.

We still treated the Python service as the specification. Before any code,
we wrote down how every area behaved: auth, accounts, training, habits, the
streak engine, social features and the schema. The rewrite had to match that
behaviour unless we decided, on the record, to change it.

## What we chose against

- **Durable Objects.** D1 batches are atomic and run in order, which gives
  us the "check, then write" guarantees we need without a coordinator.
- **KV.** Covered by the rate limit binding and a D1 table.
- **Keeping Postgres through Hyperdrive.** That would mean two providers and
  a network hop on every query, for no gain when there was no data to keep.

## What it looks like now

One Worker, `pacestreak-api`, handles HTTP requests, cron triggers and queue
messages. It has 70 tables in D1, photo and import/export storage in R2, and
a job queue with a dead-letter queue for anything that fails six times. The
next three posts cover how we kept the rewrite honest, how we tested it in a
browser, and how it went live on `api.pacestreak.com` on 19 October.
