---
title: "Building auth for an app that holds health data"
description: "RS256 access tokens held only in memory, rotating refresh tokens with reuse detection, CSRF on cookie transport, TOTP with replay protection, and the gaps we have written down rather than hidden."
date: 2026-09-25T11:00:00Z
tags: ["api", "security", "auth", "fastapi"]
---

Training logs are health data. They show when you're injured, when you're
ill, what you weigh if you track it, and where your routine puts you at 6am.
The auth system under `/v1/auth` was the first thing built in the API, and
nothing in it is novel. It's the careful version of every decision, which is
the point.

## Two tokens, two jobs

**The access token** is an RS256-signed JWT that lasts 15 minutes. It goes in
an `Authorization: Bearer` header and is verified by signature alone, with no
database hit, so most requests cost nothing to authenticate.

In the app it lives **in memory only**. It's never written to localStorage or
sessionStorage. An XSS bug that can read storage can't lift a credential that
isn't there, and one that runs in the page gets a token that dies within 15
minutes.

**The refresh token** lasts seven days and lives in an HttpOnly cookie scoped to
the API's auth path. Page code never sees it. It's single-use: every refresh
rotates it.

## Reuse detection

Rotation is what makes theft detectable. Every refresh token belongs to a
session family. If a token that has already been rotated is presented again,
one of two parties holds a copy it shouldn't: the real user or an attacker.
The API can't tell which, so it **revokes the whole family**. Both are signed
out, and the real user signs back in with their password. The attacker can't.

This is the single most valuable property in the system, and it's cheap: one
lookup on refresh.

## CSRF on the cookie path

Anything authenticated by a cookie can be forged by another site, so every
cookie-authenticated endpoint (`/refresh`, `/logout`) also needs an
`X-CSRF-Token` header. The token arrives at login, and it's **replaced on every
refresh**, so the client re-reads it each time. There is no endpoint that hands
one out.

The app keeps the CSRF token in localStorage so a page reload can refresh. That
looks like it contradicts the in-memory rule, but it doesn't: the CSRF token is
useless without the HttpOnly cookie that only the browser can send.

## One cookie, one trust boundary

The app lives on `app.pacestreak.com` and the API on `api.pacestreak.com`.
They're cross-origin but **same-site**, which shapes the cookie:

- `Domain=pacestreak.com`, so the browser sends it to the API.
- The `__Secure-` prefix, not `__Host-`, because `__Host-` forbids `Domain`.
- `SameSite=Lax` is enough, because same-site requests carry it.
  `SameSite=None` would widen exposure for nothing.
- CORS names the app's origin explicitly. A wildcard is rejected when
  credentials are included anyway.

The consequence is a standing rule for the whole organisation: **nothing
untrusted may ever be hosted under `pacestreak.com`.** A cookie scoped to the
domain is sent to every subdomain on it.

## Passwords

- **At least 16 characters.** Length does more than composition rules, and a
  password manager makes it free.
- **Argon2**, via `pwdlib`'s recommended hasher.
- **Constant work for unknown accounts.** Logging in as someone who doesn't
  exist still verifies against a dummy hash, so response time doesn't reveal
  who has an account.
- **Generic errors** everywhere enumeration is possible. `/forgot-password`
  always reports success.

Changing a password keeps the current session and ends every other one.
Resetting it through an emailed link ends all of them, because a reset means
you've lost control of something.

## Two-factor

TOTP sits between the password and the session as a **separate MFA challenge
token**. It is never a flag on the access token, so there's no state in which a
half-authenticated token can reach a real endpoint.

- The secret is **encrypted at rest**.
- `totp_last_used_step` stores the last accepted time step, so a code can't be
  replayed, even inside its own 30-second window.
- Enabling it needs the password plus a valid code. Otherwise a stolen session
  could lock the real owner out behind an authenticator the attacker controls.
- Ten single-use recovery codes, replaceable at any time.

## Rate limits and a security history

Redis-backed per-IP limits cover `/signup`, `/login`, `/2fa/verify`,
`/forgot-password` and `/resend-verification`. Sign-ins, password changes and
two-factor changes are written to a per-user `security_events` table the user
can read in settings.

## The gaps, written down

The API's README has a "Known gaps" section, because a gap you've written down
is a decision and one you haven't is a surprise:

- TOTP replay protection covers this installation's own login flow, not a
  code someone shared out of band before it was used here.
- There's no per-account lockout beyond the per-IP rate limit, so a
  distributed attacker still gets a guess budget per address.
- There's no outbound email provider yet. In development, verification and
  reset links go to the API log. Choosing one is a deliberate decision, not an
  oversight, because the project adds no third-party services casually.

## Verifying email

Verification is a single-use link, not a numeric code. `issue_one_time_token`
creates a hashed, purpose-scoped token (`EMAIL_VERIFY` or `PASSWORD_RESET`),
and redeeming it burns it. The only numeric codes anywhere in the system are
TOTP codes.
