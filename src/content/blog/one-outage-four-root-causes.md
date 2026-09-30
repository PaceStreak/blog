---
title: "One outage, four root causes"
description: "The API went down behind a Cloudflare Tunnel error and stayed down through a reboot, an interrupted OS upgrade, a stale connection pool, and a box too small for its own workload. None of the four were the same bug."
date: 2026-09-30T16:10:00Z
tags: ["api", "infrastructure", "deployment", "reliability"]
---

`api.pacestreak.com` started returning Cloudflare's Error 1033 - "Cloudflare
is currently unable to resolve" the tunnel. That single symptom turned out to
have four unrelated causes stacked on top of each other, each one hiding the
next until the one under it got fixed. None of them were exotic. All of them
were the kind of thing that's obvious in hindsight and invisible while it's
happening, because the error on screen never once described the actual
problem.

The box behind all of it is a GCE `e2-micro`: one shared vCPU, 1 GB of RAM,
running `api`, `worker`, and `cloudflared` under Docker Swarm. That
undersizing turns out to be the thread that ties the whole thing together,
but it took four separate investigations to see it.

## First cause: a swapping host takes the tunnel down with it

Cloudflare Tunnel error 1033 means one thing at the protocol level: the
`cloudflared` connector isn't reachable from Cloudflare's edge. The
instinctive read is networking - a firewall rule, a DNS record, a dead
container. None of that was it.

`docker service ls` showed `cloudflared` at 1/1 and `api` at 0/1, with the
API's last few tasks exited `137` - killed, not crashed. `free -m` explained
why: 953 MB of RAM, 481 MB used, and 511 MB of swap in active use on a box
with barely a gigabyte to give. The system was swapping hard enough that
Docker's own internal DNS resolver started timing out against the metadata
server:

```
level=warning msg="[resolver] connect failed" error="dial udp 169.254.169.254:53: i/o timeout"
level=error msg="failed to get longest-active member" error="failed to find longest active peer" raft_id=41b5702ccdca7c0c
```

That second line is Docker Swarm's single-node raft store losing its own
heartbeat to itself - not because there's another node to talk to, but
because the health-monitor goroutine couldn't get scheduled promptly enough
under memory pressure to hit its own deadline. Once the daemon's internal
bookkeeping is that starved, `cloudflared`'s outbound QUIC connection to
Cloudflare's edge is not a priority the kernel is going to protect. The
tunnel drops, and the error that surfaces publicly - 1033, unreachable
connector - has nothing in it that points back to swap.

The fix at this layer was a clean reboot, plus two changes to
`compose.gcp.yaml` while already in there: forcing `cloudflared` onto
`--protocol http2` instead of the QUIC default (one fewer UDP-based thing to
go wrong under pressure), and changing the restart policy from `on-failure`
to `any`, so a task that exits cleanly but wrong still gets restarted instead
of sitting there.

## Second cause: an OS upgrade that stopped at the worst point

While diagnosing the tunnel, it came out that a `do-release-upgrade` to
Ubuntu 26.04 had been run on this same box earlier and had died partway
through - the browser running it closed, and the command couldn't finish.
The system was already reporting `VERSION_ID="26.04"` in `/etc/os-release`,
which is the trap: the OS identifies as upgraded well before the package
database agrees.

```
sudo dpkg --audit
```

listed `grub-efi-amd64-signed`, `shim-signed`, `cloud-init`,
`google-guest-agent`, `ubuntu-server`, and eight other packages unpacked but
never configured. Two of those are the entire reason a cloud VM boots at
all - the signed bootloader chain and the metadata-driven SSH key agent - and
the running kernel still expected the old ones. A reboot in that state is a
coin flip between a working boot and neither.

`dpkg --configure -a` is the right command and also, on a box this small,
the wrong thing to run attached to an SSH session with a client-side
timeout: several attempts were silently killed mid-run when the local
`timeout` wrapper expired and took the SSH connection with it, which - as
far as `dpkg` is concerned - looks identical to the power going out. Each
half-run left the package database in a worse state than before, not a
better one. The fix was mechanical once diagnosed: detach the process from
the SSH session entirely -

```sh
setsid nohup dpkg --configure -a > /tmp/dpkg-configure.log 2>&1 < /dev/null &
disown
```

- and poll the log from a separate connection instead of trusting a
single long-lived one to survive. `grub-install` and `shim-signed` both
completed cleanly for the `x86_64-efi` platform once given the room to
finish, `dpkg --audit` came back empty, `apt full-upgrade` had nothing left
queued, and only then was a reboot safe. It came back clean.

## Third cause: a stale front-end on the database pooler

Reboot done, upgrade done, `cloudflared` and `worker` both healthy - and
`api` still wouldn't start. Its entrypoint runs `alembic upgrade head` before
serving anything, and that call just hung. No error, no timeout, nothing in
the logs past `entrypoint: running migrations`.

The instinct here was DNS again, since that's what caused problem one. It
was a dead end, and a useful one to rule out fast:
`SELECT pid, state, wait_event FROM pg_stat_activity` against the Neon
Postgres instance showed nothing blocking, no waiting locks in `pg_locks`,
and a raw TCP connect from inside the container to the database's IP
succeeded in 22 milliseconds. The network path was fine. The database itself
was fine. And yet a real connection attempt - SSL handshake included, via
the actual `postgresql+asyncpg` URL the app uses - hung indefinitely from
inside the exact same container.

The detail that cracked it: the `worker` service, running the identical
image against the identical `DATABASE_URL`, had one connection open and
idle the whole time, working perfectly. Same code, same credentials, same
network. The only difference was that `worker`'s connection was already
established before things went wrong, and `api` needed a *new* one.

Neon's `-pooler` hostname routes through PgBouncer in front of the actual
Postgres backend. `pg_stat_activity` shows backend-level state - it has no
visibility into the pooler's own front-end connection table, which is where
a fresh connection queues before it ever reaches a backend worthy of
showing up in that view. An hour of container churn - every restart of
`api` during the first two causes above opening and then getting SIGKILLed
mid-connection - had left that front-end table full of half-open sockets
the pooler hadn't reaped yet. New connection attempts weren't refused; they
were queued behind garbage that was never going to clear itself.

The fix took one call: restarting the Neon compute endpoint, which drops
and rebuilds the pooler's connection table from nothing.

```
POST /projects/{id}/branches/{id}/endpoints/{id}/restart
```

Migrations connected immediately afterward. This is worth remembering as its
own lesson, separate from the three around it: a pooler sitting in front of
a database is a stateful thing with its own failure mode, and "the database
is fine" and "you can get a new connection to the database" are different
claims that this incident made look identical until they weren't.

## Fourth cause: the box was still too small for what it was running

`api` could now migrate and start - and then got killed by its own
healthcheck, repeatedly, non-deterministically. Sometimes it made it to
`Uvicorn running on http://0.0.0.0:8000` before dying. Sometimes it didn't
get past printing that it was starting. `dmesg` had no OOM kills logged
anywhere, which ruled out the obvious explanation and took longer to rule
out than it should have.

`ps aux --sort=-%cpu` was the tool that actually found it. The Python
process itself was sitting in `D` state - uninterruptible sleep, blocked on
I/O, not on CPU - with `kswapd0` actively working in the background. That's
not a slow process; it's a process that has handed control to the kernel and
is waiting for a page to come back from swap before it can do anything else
at all, including answer a health check on a socket it already has open.
`free -m` at the same moment: 108 MB free, 321 MB in swap, on a box also
running `dockerd`, `containerd`, `snapd`, and two separate Google Cloud
observability agents (`otelopscol` and `fluent-bit`) as fixed background
cost before a single application container gets to run.

Buried in the process list was a second, unrelated finding: an earlier
`docker service scale` command, issued from a session that had itself
timed out locally, was still running server-side six minutes later - Swarm
CLI invocations aren't guaranteed to die with the SSH connection that
started them, so a command that looks abandoned from one end can still be
live and consuming a share of a single shared vCPU on the other. It got
killed by hand.

The actual fix here wasn't a configuration change, because there wasn't a
bug to fix - there was a resource budget that didn't add up. Scaling `api`
to zero replicas stopped the crash loop from itself feeding the contention
(every failed start was another process competing with the next one for the
same fractional CPU), stopping the two non-essential logging agents freed
a real if modest amount of RAM, and scaling back up to a single clean
attempt - with nothing else contending for the CPU at that exact moment -
was what finally let one boot sequence run start to finish without getting
starved partway through.

```
api.pacestreak.com/health: 200
```

## What actually explains all four

Every one of these had a plausible, wrong first explanation: 1033 looks like
networking, a hung migration looks like DNS, a health-check crash loop looks
like an application bug. Every one of those first guesses got tested and
ruled out with a specific piece of evidence - `pg_locks`, `dmesg`, a raw TCP
connect from inside the failing container - before moving to the next
hypothesis. That discipline mattered more than any individual fix, because
the four causes didn't share a mechanism. They shared a symptom, and shared
a host.

The host is the real finding. An `e2-micro` is one shared vCPU and 1 GB of
RAM, and this stack asks it to run a Swarm manager, two application
containers, a tunnel daemon, and two logging agents at once, with nothing
held in reserve for an OS upgrade, a burst of container restarts, or a
database reconnect to happen at the same time as everything else. Each of
the four causes above is the kind of thing that happens *occasionally* on a
box with headroom - a swap spike, an interrupted upgrade, a pooler that
needs a kick, a slow boot. On this box, they happened in the same hour,
because there was no slack anywhere for any one of them to be absorbed
without becoming the next one's precondition.

Moving off `e2-micro` is now the first item on the infrastructure list, not
because any single cause here demands it, but because all four of them
would have been shorter incidents - some of them non-incidents - on a host
with room to breathe.
