---
title: "Testing the whole product against the real Worker"
description: "The Playwright suite now drives a production build of the app against the Workers API running under wrangler dev, with local D1, Queues and R2. Writing it found a frozen handle suggestion, a lost ?next= redirect with an open redirect behind it, and a test that only passed on Mondays."
date: 2026-10-20T06:00:00Z
tags: ["testing", "app", "api", "bugs"]
---

Unit tests on each side of an API boundary can all pass while the product
is broken. Each side can be right by its own tests and still disagree with
the other. So before the Workers API went live, we pointed the app's
browser tests at it and filled in every main flow that didn't have one yet.

## The setup

The end-to-end suite is Playwright, using a phone-sized browser, against
the app's **production build**. In CI, the job used to start the Python API
with Postgres and Redis. Now it checks out the Workers API and runs it
under `wrangler dev`, which provides local D1, Queues and R2. Nothing in
the suite talks to a real Cloudflare account:

- **Throwaway secrets**, used for nothing else.
- **Cloudflare's always-pass Turnstile test key**, so the bot check runs
  for real but always says yes.
- **Console mail.** Sign-up, reset and sign-in codes are printed to the API
  log. The tests read the newest six-digit code for an address from there.
  Each read marks a point in the log, so a later code can't be confused
  with an earlier one.
- **`IP_LIMITS_OFF`**, a development-only switch for the per-IP rate
  limits. Without it, a suite that signs up dozens of accounts from one
  address in a minute would be blocked by them. The API refuses to start with it anywhere but development.

Each test creates its own throwaway account. The suite asks the API's
public `GET /v1/config` whether email is on. If it is, the emailed-code
specs run. If it isn't, the recovery-code specs run instead. Running the
suite twice covers both modes.

New specs cover signup through onboarding, password reset and recovery
codes, authenticator sign-in, a habit's whole life including undo and the
trash, nutrition totals, the journal, groups with an invite and a
challenge, profile, export, account deletion, and returning to the right
page after signing in.

## The handle that stopped following the name

During onboarding you type your name, and the app suggests a handle from
it. The suggestion only updated while the handle field was empty. Once
the first letter of the name filled the handle, the field wasn't empty any
more, so the suggestion froze at that letter. Now it follows the name until
you edit the handle yourself.

## The lost `?next=`, and the open redirect behind it

Open a group invite while signed out, and the app sends you to sign in
with `?next=` pointing back at the invite. After signing in, you should
land on the invite. You landed on the home screen instead.

The cause was a race. Signing in sets the session to "ready". The wrapper
that guards signed-out pages saw that and redirected to `/` before the
login screen's own redirect to `next` could run. The fix makes the wrapper
honour `?next=` itself.

While fixing it, we noticed the check both places used: `next` was trusted
if it started with `/`. A **protocol-relative** URL like `//example.com`
starts with `/`, and a browser reads it as a different site. So a crafted
sign-in link could have sent someone off PaceStreak right after they signed
in. Both places now refuse anything that starts with `//`. A spec covers
the redirect.

## The test that passed on Mondays

The habit lifecycle spec creates a habit, ticks it off and expects the
week counter to read `1/7 this week`. Run on a Tuesday, it failed with
`1/6`.

The app was right. A habit made in the middle of a week only counts the
days left in that week: seven on a Monday, six on a Tuesday, and so on. The
test had been written on a day when the answer happened to be seven. Now it
reads the target from the screen before ticking anything and checks the
counter against that, so it passes on any day of the week.

## Smaller finds from the same pass

- **The CSV export was saved as `.csv`, but it is a zip.** The API's
  `Content-Disposition` header wasn't readable cross-origin, so the app
  used a fallback name based on the format. The API now exposes the header
  to allowed origins, and the fallback goes by content type.
- **A confirm dialog that never appeared.** Asking a second time within
  220 ms of the first, while the first was still animating closed, left a
  pending timer that shut the new dialog straight away.
- **A card that wouldn't leave.** After "Keep my account", the "set to be
  deleted" card stayed. Any refetch cancelled the timer meant to remove it,
  because both shared one effect. The timer now has its own.

Each of these would have shipped. The unit tests on both sides were green
the whole time.
