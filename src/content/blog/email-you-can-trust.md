---
title: "Email you can trust: one switch, three transports, codes at sign-in"
description: "Email in PaceStreak is now a capability you can turn off without breaking anything, sent through whichever transport fits, with a code at every new sign-in. Habit names never reach a subject line or a push title. No newsletters, no marketing email."
date: 2026-10-20T09:00:00Z
tags: ["security", "auth", "privacy", "email", "api"]
---

Email does three jobs in PaceStreak. It proves you own an address. It lets
you back into your account. It tells you about things you asked to hear
about, like a streak at risk or a weekly digest. All of it was reworked
during the move to Workers. This post covers the design and the rules
behind it.

## One switch: email on or off

`EMAIL_ENABLED` is a single setting on the API. When it's off, the product
still works fully:

- Sign-up needs no code, and nothing waits on a confirmed address.
- Every new account gets **ten recovery codes**. With no inbox to send a
  reset link to, they're the way back in after a lost password.
- Routes that only make sense with email, such as verify, reset and
  confirm change, answer `404 {"detail": "Email is turned off"}`. Push
  routes do the same when push isn't configured.
- The app asks the public `GET /v1/config`, or `/v1/me` once you're signed
  in, and hides every email screen, card and setting.
- Push and the in-app inbox keep working.

Turning it back on brings everything back. Accounts made while it was off
confirm their address once, at their next sign-in. We built the switch so
a mail outage, a quota running out or a provider change is never a reason
the product stops working.

## Three transports, chosen by one variable

`MAILER` selects how mail leaves the Worker:

- **`smtp`** submits to a relay on port 587 over STARTTLS, using Workers TCP
  sockets. That's what production uses today, through Brevo's SMTP relay.
  Port 25 is refused outright.
- **`brevo`** posts to Brevo's HTTP API.
- **`cloudflare`** uses Cloudflare Email Service. Sending to arbitrary
  addresses needs a plan we're not on yet, so it's ready but not in use.
- **`console`** prints to the log, for development and tests. Production
  refuses it.

All three real transports send the same message. It goes out with the
same headers: Reply-To (`hello@pacestreak.com`, so a reply reaches a
person), Auto-Submitted, Message-ID and a one-click List-Unsubscribe. The
app never knows which transport sent it.

Three rules apply to all of them:

- **The API won't start with email on and the chosen transport
  misconfigured.** A missing secret shows up at deploy, not when the first
  person signs up.
- **A CR or LF in any header refuses the send**, which closes off header
  injection.
- **A failed send is logged with the step and the reply code**, for
  example `smtp auth answered 535`. The log never includes a secret or the
  message body.

## A code at every new sign-in

Every account without an authenticator app now gets a **six-digit code by
email** after its password. It's on by default, because a second factor
shouldn't depend on someone installing an app first. The code:

- lasts 10 minutes and works once;
- allows five attempts, and every attempt is saved. The Python service had
  a bug where the five-attempt cap never counted, which we covered in the
  [rewrite post](/posts/a-rewrite-that-had-to-prove-itself);
- can be resent, with limits on how often.

Ticking **"trust this device"** skips the code on that device for 30 days.
That isn't just convenience. Without it, every sign-in would spend part of
a shared daily sending quota, and an email outage would lock everyone out.
Trusted devices are revoked by "Sign out everywhere" and by changing your
password.

An authenticator app replaces the email code, and a passkey counts as two
factors on its own. **Recovery codes** work in place of any code, and for
password reset. Any account can generate a fresh set with its password.
If two-factor is on, that also needs a current authenticator code, so a
password alone can never create codes that skip the second factor.

Signing up now sends **no email at all**. Earlier it sent a verification
code, and then the app's automatic sign-in sent a second code, which was
the only one anyone typed. Now the first sign-in code also confirms the
address: one email instead of two, and less confusion.

The same work fixed the **new sign-in notice**, which had never fired on
the new API. A query compared the user id with the wrong table's `id`
column, so every sign-in looked like the account's first. When you've just
entered a mailed code, the notice skips email, since a second message a few
seconds after the code is noise.

## Habit names never reach a subject line

One rule matters more than the rest. **No email subject, push title or push
body names a habit or a streak chain.** Subjects and push titles appear on
lock screens and in notification previews. Someone working to break a
drinking or smoking habit must never be outed by their phone lighting up
on a table.

So a habit reminder's title is "Habit reminder", and streak-at-risk and
milestone messages say "this streak". The specifics go only in the email
body and the in-app inbox, which you see after you've unlocked the phone
and opened them. A test checks every title and push body.

## What we send, and what we don't

Each of these is a category you can turn off in notification settings, and
every email carries a one-click unsubscribe:

- codes: sign-up confirmation, password reset, email change, sign-in;
- security notices: new sign-in, password changed;
- streak-at-risk nudges, habit reminders, the weekly digest;
- buddy nudges and challenge results;
- milestones: long streaks, personal records, every fifth level. This is a
  new category, on for email and off for push by default.

**No newsletters, no marketing email.** The app says so on the sign-in
screen and in notification settings, and here's why it stays true. Mail
volume is a shared budget, and a newsletter could crowd out the codes people
need to sign in. Marketing mail needs explicit opt-in consent and a record
of it. And bulk mail that people ignore hurts a domain's reputation, which
is how sign-in codes end up in spam. If that ever changes, the copy in the
app changes first.
