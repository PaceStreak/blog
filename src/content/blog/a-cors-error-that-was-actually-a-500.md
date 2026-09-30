---
title: "A CORS error that was actually a masked 500"
description: "Login worked, /me failed, and the browser blamed CORS. The real cause was three layers down: Swarm silently ignoring a short-form tmpfs key, which meant Starlette's outermost error middleware - the one layer that runs before CORS headers exist - was the one answering."
date: 2026-09-27T20:56:00Z
tags: ["api", "infrastructure", "bugs", "docker"]
---

The symptom was clean and specific, which made it easy to misdiagnose:
logging in worked, the token came back, and the very next request - `GET
/v1/me` - failed with a CORS error in the browser console. No response body,
no status code visible to the frontend, just Firefox refusing to let the
response through because it claimed to be missing
`Access-Control-Allow-Origin`.

The instinctive fix is to go look at the CORS configuration. That would have
been wrong, and it's worth writing down why, because the actual chain runs
through three unrelated layers and the error message points at none of them.

## What a browser actually means by "CORS error"

A CORS error in the console almost always means one of two very different
things: the server genuinely didn't send the right header, or the server
crashed before it had the chance to send *any* headers from the app's own
middleware stack, and the browser's only honest way to describe "the
response didn't have what I needed" is to blame CORS. The second case is far
more common in practice than people expect, because in Starlette and
FastAPI, `CORSMiddleware` is one of several layers wrapped around your
actual route handler - and it is not the outermost one.

`ServerErrorMiddleware` sits outside every middleware you register,
including `CORSMiddleware`. It exists specifically to catch anything your
own code didn't - an unhandled exception in a route, in a dependency, in
another middleware - and turn it into a 500 instead of an unhandled crash.
But because it sits *outside* `CORSMiddleware`, a request that dies there
never passes back through the layer that would have added the
`Access-Control-Allow-Origin` header. The browser sees a response with no
CORS headers and reports exactly that, truthfully, which is why the message
is misleading rather than wrong.

So: `/v1/me` was throwing an unhandled exception, not failing a CORS check.

## What was actually throwing

`/v1/me` reads `push_public_key`, which calls into the VAPID key handling in
`app/notifications/service.py`. That function needs a genuinely writable
temporary directory - `tempfile.mkdtemp()` - and that call was failing with
`FileNotFoundError`.

The container itself was configured to be read-only with a tmpfs mount at
`/tmp`, which is the right way to run it: `read_only: true` plus a tmpfs
exception is a small, deliberate hardening pattern, not an accident. The bug
was in how that tmpfs mount was declared:

```yaml
# what was there - silently ignored under Swarm
tmpfs: ["/tmp"]
```

Docker Compose's short-form `tmpfs:` key is valid syntax under plain
`docker compose up`. It is **silently ignored** under `docker stack deploy` -
Swarm's compose parser accepts the file, accepts the key, and drops it on
the floor without a warning. `read_only: true` from the same hardening block
still applied, because that key *is* honored under Swarm. The net result:
a container that's read-only everywhere, including the one path
(`/tmp`) an exception was supposed to be carved out for it not to be.
`tempfile.mkdtemp()` tried to create a directory on a read-only filesystem,
got `FileNotFoundError` (Python's error for a failed mkdir in this case, not
the more obvious `PermissionError` one might expect), and that exception
propagated straight up to `ServerErrorMiddleware` - outside `CORSMiddleware`,
so no CORS header ever went out.

The fix is the long-form key, which Swarm does parse correctly:

```yaml
x-hardening: &hardening
  read_only: true
  volumes:
    - type: tmpfs
      target: /tmp
  security_opt: ["no-new-privileges:true"]
```

## The chain, end to end

1. Swarm ignores `tmpfs: ["/tmp"]` (short-form), but still applies
   `read_only: true` from the same block.
2. `/tmp` is read-only with no exception, contrary to what the compose file
   said.
3. `tempfile.mkdtemp()` inside VAPID key handling fails with
   `FileNotFoundError`.
4. The exception is unhandled at the route level, so it reaches
   `ServerErrorMiddleware` - the one layer that sits outside every
   user-registered middleware, including CORS.
5. The response that reaches the browser has no
   `Access-Control-Allow-Origin` header, because the layer that would have
   added it never got the chance to run.
6. The browser reports a CORS error, because from its side, that's exactly
   what happened - the header really is missing. It's just not the cause.

Nothing here was a bad guess. Login worked, so the token flow and CORS
config for that endpoint were clearly fine, which made "why would `/me`
specifically be different" the right question. The answer needed container
logs, not the network tab - the browser was reporting a true symptom of a
cause three layers removed from anything CORS-related.
