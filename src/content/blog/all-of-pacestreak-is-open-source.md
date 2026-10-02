---
title: "All of PaceStreak is open source"
description: "The app, the API, both sites and the infrastructure notes are now public on GitHub under AGPL-3.0. What that took, and what was checked first."
date: 2026-10-02T12:00:00Z
tags: ["github", "security", "privacy"]
---

Until today only two PaceStreak repositories were public: the
[status page and the org's `.github` repo](/posts/two-repositories-public-on-purpose),
both because they stop working otherwise. As of today all eight are, at
[github.com/PaceStreak](https://github.com/PaceStreak):

- [`app`](https://github.com/PaceStreak/app), the product, a React PWA;
- [`api`](https://github.com/PaceStreak/api), FastAPI, Postgres, Redis and the worker;
- [`web`](https://github.com/PaceStreak/web) and [`blog`](https://github.com/PaceStreak/blog), the two static sites;
- [`infra`](https://github.com/PaceStreak/infra), the topology, decisions and runbook;
- [`pacestreak`](https://github.com/PaceStreak/pacestreak), the root that pins them all together;
- plus `status` and `.github`, which already were.

## Why

PaceStreak asks people to log things they would not tell most friends: their
weight, what they eat, their mood, and the habit they are trying to break. The
[security page](https://www.pacestreak.com/security) and the
[privacy policy](https://www.pacestreak.com/privacy) say what happens to that
data. Now the code that does it is there to check against them. A claim like
"habits are never shown to anyone else" is easier to believe when the query
that builds a leaderboard is one click away.

Everything was already licensed AGPL-3.0, which was always the plan: anyone
running a modified PaceStreak as a service has to offer their users the
source too.

## What was checked before flipping the switch

Making a repository public publishes its whole history, not just its current
files, so the history was what got checked:

1. **Secrets.** Every commit in every repository was scanned with
   [gitleaks](https://github.com/gitleaks/gitleaks), and every path ever
   committed was checked for `.env` files, keys and certificates. Nothing.
   Production credentials have only ever lived in environment variables on the
   server and in GitHub Actions secrets, and keys are injected as PEM
   environment variables rather than files, which paid off here.
2. **Authorship.** Commit messages were cleaned of tool-generated trailers,
   and the root repository's submodule pins were rewritten to match, so every
   historical pin still resolves to a real commit.
3. **The security policy.** Each repository's `SECURITY.md` used to explain
   that it existed because the org-wide one doesn't apply to private
   repositories. That reason is gone; the files stay, so the policy travels
   with a fork.

## What doesn't change

Reporting a vulnerability still goes to
[hello@pacestreak.com](mailto:hello@pacestreak.com), never a public issue.
Nothing about how data is stored or who can see it changes; that was never
protected by the code being hidden, and it shouldn't have been.

Contributions are welcome. Open an issue first for anything bigger than a
typo; [CONTRIBUTING.md](https://github.com/PaceStreak/.github/blob/main/CONTRIBUTING.md)
says which repository owns what.
