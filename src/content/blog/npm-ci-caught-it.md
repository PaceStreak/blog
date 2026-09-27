---
title: "npm ci caught what npm install let through"
description: "A peer-dependency conflict that passed locally on npm 11 and failed in CI on npm 10, and why every check now starts with npm ci."
date: 2026-09-22T15:00:00Z
tags: ["ci", "npm", "tooling"]
---

A change passed every check on the development machine and failed in CI with
a peer-dependency error. Nothing in the code was wrong. The two machines
simply disagreed about what "installing" meant.

## Two different installs

- The development machine ran **npm 11** and `npm install`.
- CI (and Cloudflare's build) ran **npm 10** and `npm ci`.

`npm install` is forgiving. It resolves what it can, updates the lockfile if
it needs to, and moves on. `npm ci` is strict. It installs exactly what the
lockfile says, refuses if the lockfile and `package.json` disagree, and
surfaces peer conflicts that `install` would paper over. Different major
versions of npm also resolve peer dependencies differently.

So the local build had installed a tree that CI would not.

## Run what production runs

The fix was not in the code; it was in the habit. The pre-PR check for the
sites is now:

```bash
npm ci && npm run build && python3 check-html.py dist
```

`npm ci` first, because that is what Cloudflare runs when it deploys. If the
check that runs locally differs from the one that runs in production, the
local one is only telling you about your machine.

## The lesson

Reproducibility is not only about pinning versions. It is about using the
same command, in the same mode, as the environment that matters. A green
local build made with a more forgiving tool is a false green.
