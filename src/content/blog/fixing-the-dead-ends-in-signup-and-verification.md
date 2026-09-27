---
title: "Fixing the dead ends in sign-up and verification"
description: "Three real bugs found by using the OTP flow the way a person actually would: a stuck login, a false 'already registered' error, and a confirmation screen that didn't lead anywhere. Plus a status page that finally watches the whole stack."
date: 2026-09-27T21:00:00Z
tags: ["app", "api", "security", "infrastructure"]
---

Shipping the [OTP switch](/posts/the-api-is-live-and-deploys-itself) closed
one bug and opened three smaller ones, all found the same way: by actually
signing up and logging in as a person would, not by re-running the test suite
that had already gone green.

## Login had a resend button with nowhere to use it

An unverified account signing in got a "resend code" button - and nothing
else. There was no field on the login page to type a code into, so clicking
resend just meant getting another email with no way to redeem it from where
you were standing. The fix removes that dead-end entirely: a 403 from
`/auth/login` now navigates straight to the verify-email screen, the one
place a code actually does something.

## A signup that half-succeeds looked like a full failure

Signup does two calls: create the account, then log in immediately so the
next screen is onboarding rather than a second form. If that second call
failed for the *expected* reason - the account isn't verified yet - the code
handled it correctly and moved on. If it failed for anything else (a Turnstile
token already spent, a transient rate limit), the error surfaced on the
signup form itself, even though the account from the first call already
existed. Retrying then failed with "email already registered" - correctly
this time, which made it more confusing, not less: the account was real, the
error was stale, and there was still no way to reach the code-entry screen.

The fix is to stop treating that second call as load-bearing. By the time it
runs, the account already exists no matter what happens next, so any failure
there - not just the expected one - now falls through to the same
verify-email screen instead of an error on a page that has, in fact, already
done its job.

## Verifying didn't lead anywhere

The last one was a UX gap rather than a logic bug: entering a correct code
landed on a static "Email confirmed" screen with a link to open the app. On
a device that was never signed in - which is most of them, since the signup
call above fails its own login attempt before verification - clicking that
link just bounced to the login page, asking for the password all over again.

Verifying now does one of three things, in order: if there's already a
session on this device, refresh it and go straight in. If not, but the
password from signup is still in memory - carried through React Router's
navigation state, never written to any form of storage - log in with it
silently and go straight in. Only if neither applies (an emailed link opened
on a different device, a different tab days later) does it fall back to the
sign-in page, and even then with the email address already filled in rather
than blank.

None of this touched the API. Every one of these was a client-side flow
question: what does this screen do next, and does that path actually reach
the thing the person is trying to do. The same shape of bug had already
happened once in this exact flow - a stale-closure skip in the old
`VerifyEmail.tsx` that silently dropped a valid session reload - which is
exactly why it was worth re-testing by hand instead of trusting a green test
suite to mean the flow works end to end.

## The status page now watches all four hosts

Separately: `api.pacestreak.com` and `app.pacestreak.com` went from "no DNS
record yet" to live during this same stretch of work, and the status page
hadn't caught up - it was still only watching the marketing site. It now has
uptime and TLS-expiry checks for the app, the API's `/health` endpoint, and
the blog, which had quietly never been added despite being live for weeks.
Four hosts, one incident log, same as before.
