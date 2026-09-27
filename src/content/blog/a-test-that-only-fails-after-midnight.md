---
title: "A test that only fails after midnight"
description: "One test in the suite fails only between midnight and 05:30 in India. It compares the machine's local date with a server that thinks in UTC. It's also a reminder to check a failure against the code before the change."
date: 2026-09-27T01:00:00Z
tags: ["testing", "bugs", "time"]
---

The API suite has 200-odd tests. After a round of changes one failed: a group
challenge expected a score of 1 and got 0. It looked like the new code had
broken something.

## Stash first, then theorise

Before debugging, the change was stashed and the test run again on the old
code. It failed the same way. So it wasn't the change.

## The cause

The test builds a challenge starting at `date.today()`, which is the machine's
local date. It was 00:05 in India, so the local date was already the 27th. The
server logs the session at "now" in UTC, where it was still 18:35 on the 26th.
The session landed the day before the challenge began, and scored nothing.

For about five and a half hours a day, the test is wrong.

## What to take from it

- A failing test after a change is not proof the change broke it. Run it on the
  code before the change.
- `date.today()` in a test is a time bomb whenever the code under test thinks
  in a different timezone. The test should ask the same clock the server does.
- Write down the known flake rather than rerunning until it passes.
