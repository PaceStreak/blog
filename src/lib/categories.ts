/** A small, fixed set of categories layered on top of the existing tags,
    the way a real publication groups its coverage without asking every post
    to be re-tagged. Order is precedence, not display order: the first
    category whose tag set intersects a post's tags wins, so a post tagged
    both "bugs" and "api" reads as a postmortem first (the more specific,
    editorially meaningful bucket) rather than defaulting to the broad
    engineering catch-all. `engineering` has an empty tag list on purpose —
    it is what's left after nothing more specific matched. */

export interface Category {
  slug: string;
  label: string;
  /** One line, shown on the category's own page. */
  description: string;
  tags: string[];
  /** A small, muted marker colour — legible against the near-black
      background, but deliberately desaturated so it reads as an
      informational scanning aid, not a second brand accent. Lime stays the
      one accent colour for anything interactive; these are dots, not links. */
  color: string;
}

export const categories: Category[] = [
  {
    slug: "postmortems",
    label: "Postmortems",
    description: "What broke, why, and the exact chain of causes — written down while it's still fresh.",
    tags: ["bugs", "lessons"],
    color: "#e08a6b",
  },
  {
    slug: "security-privacy",
    label: "Security & Privacy",
    description: "Auth, data handling, and the constraints that come from holding health data.",
    tags: ["security", "privacy", "auth", "csp", "cookies"],
    color: "#c97fd4",
  },
  {
    slug: "infrastructure",
    label: "Infrastructure",
    description: "Hosting, deployment, monitoring, and the decisions behind where things run.",
    tags: ["infrastructure", "cloudflare", "deployment", "status", "dns", "monitoring", "docker", "stack"],
    color: "#6fb1e0",
  },
  {
    slug: "design",
    label: "Design",
    description: "The visual language, motion, and the small details that carry it.",
    tags: ["design", "ux", "motion", "brand", "fonts", "accessibility", "svg"],
    color: "#e0c56f",
  },
  {
    slug: "product",
    label: "Product",
    description: "What PaceStreak does, and the reasoning behind how it works.",
    tags: ["product", "habits", "streaks", "gamification", "body", "units", "time", "launch", "roadmap", "social"],
    color: "#d3ff3e",
  },
  {
    slug: "engineering",
    label: "Engineering",
    description: "Implementation notes: the code, the stack, and how it's built.",
    tags: [],
    color: "#8b93a1",
  },
];

const bySlug = new Map(categories.map((c) => [c.slug, c]));

export function categoryFor(tags: string[]): Category {
  for (const cat of categories) {
    if (cat.tags.length === 0) continue;
    if (tags.some((t) => cat.tags.includes(t))) return cat;
  }
  return categories[categories.length - 1];
}

export function categoryBySlug(slug: string): Category | undefined {
  return bySlug.get(slug);
}

/** Which categories a set of posts (e.g. everything under one tag) actually
    falls into, most-common first. A tag page uses this to show "this tag
    shows up in: Postmortems, Infrastructure" rather than forcing a tag to
    belong to exactly one category, which — unlike a post — it often doesn't. */
export function categoriesForPosts(postsTags: string[][]): Category[] {
  const counts = new Map<string, number>();
  for (const tags of postsTags) {
    const slug = categoryFor(tags).slug;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([slug]) => bySlug.get(slug)!)
    .filter(Boolean);
}

/** The most common tags among a category's own posts, for "browse by tag
    within this category" — every tag that shows up on at least one post in
    the category, ranked by how often it does. */
export function topTagsForCategory(postsTags: string[][], limit = 8): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const tags of postsTags) {
    for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}
