---
title: "Social features that can't be turned against you"
description: "Follows with approval, a feed checked for visibility twice, crews that share exactly three things, coach access you control, age gates, and moderation that never touches your training log."
date: 2026-09-25T12:00:00Z
tags: ["product", "social", "privacy", "api"]
---

The original plan for PaceStreak had no social layer at all. The public site
even said so: no feed, no leaderboard. That changed for a simple reason.
Training with other people is one of the few things that reliably keeps
people training. Accountability works.

What doesn't work is comparison: bodies, loads, paces, calorie burns. So the
social layer was built backwards from one question: _what could this be used
to do to someone?_ Then we removed each answer.

## Nothing is public by default

A profile has three visibility settings: `private`, `followers` and `public`.
The default is `followers`, and following someone who isn't public is a
request they approve. Nothing you log reaches anyone you haven't accepted.

There's also `sharing_paused`, a global pause that stops new activity reaching
anyone without touching the visibility setting. It exists for the week you'd
rather nobody watched: an injury, a bad month, a life event.

## Checked twice

All visibility logic lives in one module, `api/app/social/service.py`, and every
social read goes through it. The rule is written at the top:

> Visibility is checked twice: when an event is emitted (a paused or private
> account emits nothing) and again when it is read (so going private, pausing,
> blocking or being suspended retroactively hides what was already out there).
> The most restrictive answer wins.

The read-time check is the important one. Emission-time checks alone mean that
blocking someone today does nothing about the 200 events they can already see.
Checking again on every read makes every privacy change retroactive, with no
cleanup job to forget.

## What the feed contains

The feed is **system events**: a session logged, a week kept, a streak
milestone, a record, an achievement. People can react with kudos and leave
plain-text comments.

There are no uploads and no rich links. That's partly scope, and partly the
domain rule: the session cookie is scoped to all of `pacestreak.com`, so
nothing user-generated can ever be hosted under it. Plain text rendered as text
can't become a hosting problem.

Records that fail the plausibility guard (more than 15% over your previous
best) are kept for you but never emitted to the feed.

## Crews share exactly three things

Groups come in two kinds, `crew` and `coaching`, and you join with an invite
code that the owner can rotate. The consent model is in the router's
docstring:

> Joining a group is consent to share, with its members only, your handle, your
> streak and your week's progress. That is what a crew is for. Nothing beyond
> that crosses over.

A coach sees your actual sessions only if you switch on `shares_with_coach` for
that group, and loses sight of them the moment you switch it off. Sharing is
per group, so being coached by one person doesn't expose you to another.

## Challenges count attendance

A challenge has a date range and one of two kinds: `active_days` or
`weekly_target` (weeks where you kept your own target). A first-time runner and
a marathoner are playing the same game. The schema's check constraint is the
enforcement: a volume challenge isn't a setting someone can turn on later.

## Leaderboards are opt-in and capped

The [XP post](/posts/xp-that-a-heavier-bar-cannot-buy) covers the four boards.
The social rules on top of them:

- Global boards include only people who opted in.
- "Following" boards include only people you can already see.
- Group boards include only members.
- Blocks apply in both directions.
- Anyone with gamification switched off is left out entirely.

## Age gates

- **Under 13:** no account.
- **Under 16:** private only. No feed, no leaderboards, no public profile.

Sixteen is the highest digital age of consent in the EU under GDPR, so one rule
satisfies every jurisdiction without asking where someone lives. The profile
stores a birth year, not a birth date, because a full date of birth is
identifying data we'd rather not hold.

## Moderation that leaves your log alone

Reports can target a user, a comment, an event, a group or a challenge.
Moderators review them. Every action writes an audit log that nothing ever
updates or deletes.

The rule that matters most is in the admin router:

> Suspension removes social privileges only. A suspended person can still log,
> see their own history and export it: the training log is theirs, and
> moderation is about what they show other people.

## What we didn't build

No direct messages. No photo uploads. No location. No "people near you". No
body-related board of any kind. Each one would be a reasonable feature for a
different product. For this one, every one of them answers "what could this be
used to do to someone?" badly.
