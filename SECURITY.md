# Security Policy

## Reporting

**Do not open a public issue.** Email **<hello@pacestreak.com>** with what you
found, how to reproduce it, and what an attacker could do with it.

You will get an acknowledgement within 72 hours. There is no bug bounty and no
SLA beyond that — what you will get is a straight answer.

The organization-wide policy is at
[PaceStreak/.github](https://github.com/PaceStreak/.github/blob/main/SECURITY.md).
This file exists separately because **community health files from a public
`.github` repository do not apply to private repositories**, and this one is
private.

## Scope

This repository is a static blog. It has no backend, no authentication, no
user input, and ships no third-party JavaScript. The realistic surface is:

| In scope                                                         | Out of scope                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| Content injection via a post that escapes the markdown renderer  | Cloudflare or GitHub infrastructure — report to them |
| A dependency in `package.json` with a known exploitable advisory | Missing headers with no demonstrated impact          |
| A misconfiguration in `public/_headers` that weakens the CSP     | Automated scanner output with no working proof       |

## Known and deliberate

- **The site is fully public**, including the RSS feed and sitemap.
- **The CSP is `default-src 'self'` with no `unsafe-inline`.** If you find
  something loading from another origin, or an inline script executing, that
  _is_ worth reporting — it means a build change defeated the policy.
