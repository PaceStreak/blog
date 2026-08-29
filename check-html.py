#!/usr/bin/env python3
"""Fail the build on markup mistakes that ship silently.

Two classes of problem, both of which have reached production here:

Astro collapses the whitespace between a text node and an inline element, so

    Write to
    <a href="...">hello@pacestreak.com</a>
    and it will get answered.

renders as "Write tohello@pacestreak.comand it will get answered." It is silent,
it survives every linter, and it has now happened three separate times in this
file — so it gets a check rather than another manual fix.

    python3 check-html.py dist
"""

from __future__ import annotations

import pathlib
import re
import sys

# `Pace<span>Streak</span>` is deliberate: the wordmark is one word in two
# colours. Anything else abutting an inline tag is a missing space.
ALLOWED = {"e<span>"}

# Any glyph, not just a letter. The first version of this check only matched
# [A-Za-z], so it gave a clean bill of health to `</a> ·<a …>` on the 404 pages
# — a typed separator butting straight into the next link.
INLINE_BEFORE = re.compile(r"[A-Za-z0-9,;:)·—–&]<(?:a|em|strong|span|code)\b[^>]*>")
INLINE_AFTER = re.compile(r"</(?:a|em|strong|span|code)>[A-Za-z0-9(·—–]")

# CSS draws separators inside the footer link lists only
# (.footer__meta / .footer__links, via `a + a::before`). A typed separator
# THERE renders doubled. Elsewhere on the page a typed separator is correct, so
# the check is scoped to those containers rather than flagging every one.
SEPARATOR_SCOPE = re.compile(
    r"<(?:p|span)[^>]*class=\"[^\"]*footer__(?:meta|links)[^\"]*\"[^>]*>.*?</(?:p|span)>",
    re.S,
)
TYPED_SEPARATOR = re.compile(r"</a>\s*(?:·|&middot;)\s*<a")

# `application/ld+json` is a data block, not executable, so the CSP does not
# apply to it. Everything else inside <script> would be blocked outright by
# `script-src 'self'` — silently, which is how it shipped once already.
LD_JSON = re.compile(r"<script[^>]*type=\"application/ld\+json\"[^>]*>.*?</script>", re.S)
INLINE_SCRIPT = re.compile(r"<script[^>]*>[^<]")
DATA_URI = re.compile(r"(?:src|href)=\"data:(?!image/)")

# `style-src 'self'` blocks inline style ATTRIBUTES too, not just <style>
# blocks, and it does it silently - the declaration is simply dropped and the
# element renders unstyled. Adding a `view-transition-name` this way is how
# that nearly shipped. Put the rule in the stylesheet instead.
#
# Note this deliberately does not fire on `<style>` elements: Astro hoists all
# component CSS into an external file, so a literal <style> block in dist/ is
# itself worth investigating, but the attribute is the common mistake.
INLINE_STYLE_ATTR = re.compile(r"<[a-zA-Z][^>]*\sstyle=\"[^\"]")

# Highlighted code is the one legitimate source of inline styles: Shiki colours
# every token with a style attribute at build time. The blog's CSP allows
# 'unsafe-inline' for style-src precisely so those survive, so scanning inside
# <pre> would report hundreds of findings that are all working as intended.
PRE_BLOCK = re.compile(r"<pre\b.*?</pre>", re.S)


def check(path: pathlib.Path) -> list[str]:
    html = path.read_text()
    problems = []
    for m in INLINE_BEFORE.finditer(html):
        frag = m.group(0)
        if re.sub(r"\s+[^>]*>", ">", frag) in ALLOWED or frag in ALLOWED:
            continue
        if any(frag.startswith(a[0]) and a in frag for a in ALLOWED):
            continue
        problems.append(f"{path.name}: text runs into an inline tag: …{frag}")
    for m in INLINE_AFTER.finditer(html):
        problems.append(f"{path.name}: inline tag runs into text: {m.group(0)}…")

    for scope in SEPARATOR_SCOPE.finditer(html):
        if TYPED_SEPARATOR.search(scope.group(0)):
            problems.append(
                f"{path.name}: typed separator in a footer link list — "
                f"CSS already draws one there, so it renders doubled"
            )

    stripped = LD_JSON.sub("", html)
    if INLINE_SCRIPT.search(stripped):
        problems.append(
            f"{path.name}: inline <script> body — `script-src 'self'` blocks it"
        )
    if DATA_URI.search(stripped):
        problems.append(
            f"{path.name}: data: URI in src/href — the CSP blocks it"
        )
    for m in INLINE_STYLE_ATTR.finditer(PRE_BLOCK.sub("", stripped)):
        tag = m.group(0)[:70]
        problems.append(
            f"{path.name}: inline style attribute — `style-src 'self'` drops it "
            f"silently: {tag}…"
        )
    return problems


def main() -> int:
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "dist")
    pages = sorted(root.rglob("*.html"))
    if not pages:
        print(f"no HTML found in {root}", file=sys.stderr)
        return 1

    problems = [p for page in pages for p in check(page)]
    for p in problems:
        print(f"  {p}", file=sys.stderr)

    if problems:
        print(f"\n{len(problems)} problem(s) in the built HTML.", file=sys.stderr)
        return 1

    print(f"checked {len(pages)} page(s): markup and CSP checks pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
