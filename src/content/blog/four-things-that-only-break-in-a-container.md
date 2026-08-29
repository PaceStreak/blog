---
title: "Four things that only break inside a container"
description: "Setting up the PaceStreak backend on uv, Ruff and ty, then wrapping it in Docker. Every real bug came from running it, not from reading it."
date: 2026-08-30
tags: ["docker", "python", "fastapi", "infrastructure"]
---

The backend now exists as a repository with a stack: **Python 3.14, FastAPI, and
the Astral toolchain** — [uv](https://docs.astral.sh/uv/) for packaging and the
interpreter, [Ruff](https://docs.astral.sh/ruff/) for linting and formatting,
[ty](https://docs.astral.sh/ty/) for type checking.

No product endpoints yet. What it has is a Dockerfile, a compose stack, and an
entrypoint that picks a server command from an environment variable.

Everything below is a bug that a careful reading of the files would not have
caught. Each one needed the thing to actually run.

## `fastapi dev` and `fastapi run` disagree about the host

FastAPI's CLI has two commands. They look like the same command with different
defaults, and mostly they are:

|                  | `fastapi dev`   | `fastapi run` |
| ---------------- | --------------- | ------------- |
| reload           | on              | off           |
| `--workers`      | not accepted    | accepted      |
| **default host** | **`127.0.0.1`** | `0.0.0.0`     |

That last row is the one that matters, and it is easy to miss because on a
laptop the two are indistinguishable.

`127.0.0.1` means _only accept connections that originate on this machine_. A
container is a different machine as far as the network stack is concerned, so
when Docker forwards a request in from the host, a server bound to loopback
refuses it.

What makes it genuinely nasty is the failure mode. The container stays
`running`. The log says `Uvicorn running on http://127.0.0.1:8000`, which reads
like success. `docker compose ps` looks healthy. The request simply hangs
forever, and nothing anywhere explains why.

Two otherwise identical containers, same image, same published port:

```text
--bind 127.0.0.1  →  curl: HTTP 000, hangs, times out
--bind 0.0.0.0    →  curl: HTTP 200
```

So the entrypoint sets `--host 0.0.0.0` explicitly rather than relying on the
default of whichever command it picked. The same file works in both modes,
which is the entire point of having one file.

## Postgres 18 moved its data directory

The compose stack mounts a volume for the database. The path everyone knows is
`/var/lib/postgresql/data`, and it is what every tutorial written before this
year says.

Postgres 18 changed it. The image now keeps data in a version-specific
subdirectory so that `pg_upgrade --link` does not have to cross a mount
boundary, and it wants the volume one level up at `/var/lib/postgresql`.

It does not silently do the wrong thing, which is to its credit — it finds data
at the old location with nothing mounted at the new one and refuses to start:

```text
Counter to that, there appears to be PostgreSQL data in:
  /var/lib/postgresql/data (unused mount/volume)
```

The fix is one word in the volume path. Finding it took reading the container
logs of a service whose only symptom was `dependency failed to start`.

Worth knowing: on 17 and earlier the old path is still the correct one, and
moving an existing volume between the two is a dump and restore, not a rename.

## An empty environment variable is not an unset one

This is the one I would repeat.

Compose lets you pass a variable through with a default:

```yaml
environment:
  WEB_CONCURRENCY: ${WEB_CONCURRENCY:-}
```

That reads as "use it if it's set, otherwise leave it alone". It does not do
that. It sets the variable to the **empty string**, which is a completely
different thing from absent.

uvicorn checks for _presence_:

```python
if workers is None and "WEB_CONCURRENCY" in os.environ:
    self.workers = int(os.environ["WEB_CONCURRENCY"])
```

`"" in os.environ` is true, `int("")` raises, and the server dies during
startup. Compose restarts it. It dies again. The crash loop's stack trace is
entirely inside uvicorn and never mentions Docker, compose, or the variable
that is actually at fault:

```text
ValueError: invalid literal for int() with base 10: ''
```

The compose fix is a key with no value at all, which passes the host's variable
through only when it genuinely exists:

```yaml
environment:
  WEB_CONCURRENCY:
```

But the entrypoint also unsets empties before starting the server, because the
same blank can arrive from a hosting dashboard where someone tabbed through a
field, and closing the trap in one place only closes it for compose.

## A fade-in that hides the thing it is animating

Not a container bug, but the same shape.

The landing page's activity grid is built in JavaScript, and each square used to
be created like this:

```js
cell.style.opacity = "0";
cell.style.animation = "cellIn .32s ease forwards " + delay + "ms";
```

Set to invisible, then animated to visible, with `forwards` so it stays where
the animation ends. It works — right up until the `@keyframes` block goes
missing during a restyle. Then the animation never runs, every square stays at
`opacity: 0`, and the hero renders an empty card. No console error. No failed
request. The markup is all there in the inspector.

`backwards` is the correct fill mode here:

```js
cell.style.animation = "cellIn .32s ease backwards " + delay + "ms";
```

The delay borrows the `from` state, and when the animation finishes the element
settles at its natural opacity. A missing keyframe now costs the fade-in and
nothing else — which is the difference between a degraded animation and a blank
page.

The general rule: **the settled state should be correct without the animation**.
If the animation is what makes an element visible, then every failure of the
animation is an invisible element.

## The pattern

Three of these four produced a container that reported itself healthy, or a page
that reported no errors, while being completely broken. None of them would have
been caught by a linter, a type checker, or review.

The tooling here is good — Ruff and ty both found real problems in the Python
before it ran. But they find the class of bug that lives in the code. Every bug
in this post lives in the gap between the code and the thing it runs inside,
and the only way to see into that gap is to start it up and make a request.
