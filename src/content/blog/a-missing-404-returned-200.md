---
title: "A missing 404 page made robots.txt return HTML"
description: "Without a 404.html, Cloudflare Pages answers every unknown path with the home page and a 200. Here is what that broke."
date: 2026-09-22T09:00:00Z
tags: ["cloudflare", "bugs", "seo", "blog"]
---

The blog's `robots.txt` was once a complete HTML document. A crawler asking
for the rules got the home page instead, with a status of **200 OK**.

## Single-page fallback

Cloudflare Pages has a helpful default. If a site has no `404.html`, Pages
assumes it is a single-page application and serves `index.html` for every
path it cannot find, with a 200, so that client-side routing can take over.

For a static site that is exactly wrong:

- **Every typo is a success.** `/does-not-exist` returns the home page with a
  200, so search engines index duplicate copies of it.
- **Missing files are invisible.** If a file you meant to publish did not make
  it into the build, nothing tells you; the path still "works".

That second point is how `robots.txt` became HTML. The file was not in the
build output, so Pages served the fallback, and the fallback looked like
success.

## The fix, twice over

1. Both the website and the blog ship a real `404.html`. With one present,
   Pages returns it with a 404 status for unknown paths.
2. Both sites now **assert** in CI that `404.html` exists in the build
   output. The page is small and easy to delete by accident in a refactor, so
   a missing one fails the build instead of quietly turning every unknown
   path into a 200.

## The lesson

Defaults that are helpful for one kind of site are harmful for another. When
a platform does something "for you", find out what it does when a file is
missing, because that is when you will find out whether you agree.
