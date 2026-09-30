---
title: "Grouping the week board by category, but only when it helps"
description: "Habits already had a category and a colour. The one thing Today's week board didn't do with that was use it to group the rows - and it still doesn't, for the common case of one category, on purpose."
date: 2026-09-27T13:22:14Z
tags: ["app", "habits", "ux"]
---

Habits have had a category since the redesign - health, learning, mind,
people, focus, money, home, creative - and that category already drove one
thing: `markerFor`'s colour. What it never drove was layout. Today's week
board, the calendar-style grid of one row per habit and seven boxes to cross
off, rendered every habit as one flat list ordered by time of day, category
or not.

That was the one missing piece of the grouping request, and it was missing
because the pieces around it already existed - the picker, the model field,
the colour convention - which made it easy to assume grouping was already
happening somewhere. It wasn't.

## Group when it's useful, not always

The fix buckets habits by category, in the order each category first
appears in the list, with a plain header per section:

```tsx
const catalog = useHabitCatalog();
```

But it only does that when more than one category is actually in use. Most
accounts have a handful of habits and don't bother assigning categories
beyond the default (`other`) - for those, grouping by category would mean
one section with one header, which is strictly worse than the flat list
that was already there: an extra label with nothing to organize. So the
board stays flat exactly as before unless there's a real mix to organize,
and the moment there is, the sections appear without anyone having to turn
anything on.

This is the same instinct behind a few other things on this list already: a
feature that only pays for itself in the cases where it helps, and gets out
of the way completely otherwise, rather than being a setting someone has to
know to reach for.
