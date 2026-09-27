---
title: "Tests that truncate every table"
description: "The API's test suite empties the database it points at, including the dev admin account. How we keep it pointed at the right one."
date: 2026-09-26T09:00:00Z
tags: ["testing", "api", "postgres", "python"]
---

PaceStreak's API has a couple of hundred tests, and they are fast partly
because of one blunt choice: between tests, the suite truncates every table.
That keeps each test independent and avoids slow setup and teardown.

It also means the suite will happily empty whatever database it is pointed
at, including the development one, the one with the admin account and
everything you created while clicking through the app.

## How it bites

The development stack runs Postgres on port 5432 with the `pacestreak`
database. If the test run picks up the same connection settings (say, from
the same environment file), the first test truncates the development data.
There is no prompt, because from the tests' point of view nothing is wrong.

## The fix

Tests run against a separate database, `pacestreak_test`, on the same
server. The API's README documents how to create it and how to point the
suite at it, and the project notes repeat it in bold where anyone starting a
session will see it:

> `make test` truncates every table in the database it points at.

## Why not make the tests safer instead

It is possible to make the suite refuse to run against any database whose
name does not end in `_test`, and that is a good extra guard. But the main
defence is the habit: tests have their own database, and nobody's real work
lives there. A guard that fires is a reminder that the habit slipped.

## The lesson

Fast tests often get their speed from being destructive. That is fine, as
long as what they destroy is theirs.
