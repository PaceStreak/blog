---
title: "A toast button that could never be clicked"
description: "Adding an 'Add a note' action to a toast revealed that no toast button in the app had ever worked: the swipe-to-dismiss handler captured the pointer and stole every click."
date: 2026-09-26T21:00:00Z
tags: ["bugs", "app", "pointer-events"]
---

When habit notes shipped, ticking a habit started showing a toast, *Journal:
done*, with an **Add a note** button. In the browser test, the button did
nothing. Not an error. Nothing.

## Suspects

The first guess was that the habit row had re-rendered and the callback was
stale. It hadn't. The second was that the test had clicked an older, stacked
toast. Partly true, and irrelevant: clicking the right one did nothing either.
The tell was that the toast didn't dismiss, and the button calls `dismiss`
after the action.

## The cause

Toasts can be swiped away. The swipe handler did this on `pointerdown`:

```ts
ref.current?.setPointerCapture(e.pointerId);
```

Pointer capture redirects every later event for that pointer, including the
`pointerup` that makes a click, to the capturing element. The `click` fired on
the toast container, never on the button inside it. Every toast button in the
app had been dead since swipe-to-dismiss was added, including the X to close
one. Nobody noticed because most toasts have no button and all of them time
out on their own.

## The fix

Don't start a drag from a button:

```ts
onPointerDown={(e) => {
  if ((e.target as HTMLElement).closest("button")) return;
  drag.current = { x: e.clientX, t: performance.now() };
  ref.current?.setPointerCapture(e.pointerId);
}}
```

## The lesson

Pointer capture is the right tool for drags and the wrong default for a
container that holds controls. And a feature with no test is a feature nobody
knows is broken: the bug surfaced only because a new feature used a toast
button in an end-to-end run.
