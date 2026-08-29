/** Shared post helpers. Kept out of the components so the index, the tag
    pages and the post template cannot format a date three different ways. */

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Rough reading time. 200 wpm is the usual desk figure; this is a hint for
    the reader, not a measurement, so it is deliberately unfussy. */
export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
