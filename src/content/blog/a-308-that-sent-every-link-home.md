---
title: "A 308 that sent every link home"
description: "Reloading any page in the app, or opening a shared link, landed on Today. The SPA rewrite rules pointed at /index.html, and Cloudflare Pages redirects that to /. It had been true for every deployment."
date: 2026-10-02T11:00:00Z
tags: ["postmortem", "infrastructure", "app"]
---

While verifying the new day view in production, `/day/2026-10-02` came back
404, and `/search` came back with a **308 to /**. Checking older routes
showed it wasn't new: `/habits` did the same, on every deployment going
back as far as the list went.

## What was happening

The app is a single-page app on Cloudflare Pages. A generated `_redirects`
file rewrites each known route prefix to the app shell:

```text
/habits   /index.html 200
/habits/* /index.html 200
```

A `200` rule is meant to serve the target file in place, with no redirect.
But Pages also normalises URLs: a request for `/index.html` is redirected
to `/` with a 308. That normalisation applied to the rewrite target too.
So every deep link became a redirect to the home page.

In daily use it hid well. Moving around inside the app never reloads the
page, so it worked. It only broke on a reload, a link opened from outside,
or a home-screen shortcut, and each of those looks like a minor glitch
rather than a bug.

## The fix

Rewrite to `/` instead, which serves the same file:

```text
/habits   / 200
/habits/* / 200
```

It went to a preview branch first. All six routes tested returned 200
with the app shell, including nested routes and query strings. An unknown
path still returned a real 404, and `robots.txt` was still plain text.
Then it was merged.

## The lesson

Checking a route with `curl` that follows redirects, or in a browser,
would have shown the page loading and nothing wrong. Checking the **status
code without following redirects** is what showed the 308. Deep-link
checks now look at the status, not just the final page.
