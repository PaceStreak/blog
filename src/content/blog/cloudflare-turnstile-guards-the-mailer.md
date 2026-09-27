---
title: "Cloudflare Turnstile guards the mailer, not the login screen"
description: "Turnstile went on signup, login, forgot-password, resend-verification and recover for one reason: those five endpoints can empty a free email quota or grind past a rate limit, and a CAPTCHA on the feed or the streak grid would only annoy people who never touch them."
date: 2026-09-27T14:00:00Z
tags: ["security", "csp", "app", "api"]
---

Turnstile isn't on the whole app. It's on five endpoints: signup, login,
forgot-password, resend-verification and recover. Every one of them can be
hit by a script with no cost to the person running it, and every one of them
either sends an email or tries a password.

## What it's actually stopping

Email is metered. The free tier of a transactional provider gives you a daily
send limit, and every signup, resend and password reset burns one. A script
that hits `resend-verification` in a loop doesn't need to guess anything — it
just needs the endpoint to exist and be free to call. Long before it does
anything else, it's spent the day's email quota on nothing.

Login and recover are the other kind of problem: not quota, but attempts.
Rate limits already exist per IP, but a botnet spreads the same attack across
enough IPs that a per-IP limit stops mattering. Turnstile doesn't replace the
rate limit. It sits in front of it, so the traffic that would exhaust the
limit mostly never reaches it.

## Why not everywhere

Everything else — logging a session, ticking a habit, opening the week
board — is authenticated, already rate-limited by the account it belongs to,
and produces no email and no login attempt. Putting a challenge in front of
those endpoints would slow down every real use of the app to solve a problem
that doesn't exist there. A guard belongs exactly where the thing it's
guarding against can happen, not everywhere out of caution.

## One script, one exception

The app's Content Security Policy is `default-src 'self'`: no third-party
script, frame or connection anywhere, on principle. Turnstile is the one
deliberate exception, scoped to `challenges.cloudflare.com` and nowhere else
in `_headers`. It's Cloudflare's own product rather than a new vendor, which
is the only reason it earned the exception at all — and it stays app-only.
The marketing site and the blog stay untouched; neither one sends email or
accepts a password.

It also caught two build quirks before anyone else did: Astro inlining a
short `<script>`, and Vite emitting a small compiled asset as a base64
`data:` URI. Both are silently blocked by a script-src of `'self'`. The fix
in both cases was `assetsInlineLimit: 0` in the Vite config, not a looser
policy — the CSP was right, the build was wrong.
