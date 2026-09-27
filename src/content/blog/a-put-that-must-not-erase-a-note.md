---
title: "A PUT that must not erase your note"
description: "Notes on habit days exposed a classic API trap: an idempotent PUT that sets a day's amount would also wipe its note. Pydantic's model_fields_set tells 'not sent' apart from 'sent empty'."
date: 2026-09-26T22:00:00Z
tags: ["api", "fastapi", "habits"]
---

Habit days are set with an absolute `PUT /habits/{id}/days/{date}`: send the
amount, the server stores it. Absolute rather than incremental on purpose, so
an offline retry can never double-count.

When notes came along, the same endpoint took an optional `note`. The first
version did the obvious thing:

```python
row.amount = body.amount
row.note = (body.note or "").strip() or None
```

Which means ticking a day you'd already written about erased what you wrote.
The app's tick button sends `{"amount": 1}` with no note, and `None` overwrote
the text.

## Not sent is not the same as empty

Pydantic records which fields the client actually sent in `model_fields_set`.
That gives three honest cases:

- `note` **not sent**: keep whatever is there.
- `note: ""` **sent empty**: clear it.
- `note: "..."`: set it.

```python
if "note" in body.model_fields_set:
    row.note = (body.note or "").strip() or None
```

## A day that's only a note

The same change raised a second question: what if you untick a day that has a
note? Before, amount zero deleted the row. Now a day can hold just a note
(*ill, rested*): amount zero, so not done, but kept. Clearing both the amount
and the note removes it.

## Tested as a sequence

The test walks through what a person would do: write a note, tick again,
untick, and finally clear everything, checking the stored day after each step.
The bug was in the sequence, so the test is one.
