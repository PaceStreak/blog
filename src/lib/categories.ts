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
}

export const categories: Category[] = [
  {
    slug: "postmortems",
    label: "Postmortems",
    description: "What broke, why, and the exact chain of causes — written down while it's still fresh.",
    tags: ["bugs", "lessons"],
  },
  {
    slug: "security-privacy",
    label: "Security & Privacy",
    description: "Auth, data handling, and the constraints that come from holding health data.",
    tags: ["security", "privacy", "auth", "csp", "cookies"],
  },
  {
    slug: "infrastructure",
    label: "Infrastructure",
    description: "Hosting, deployment, monitoring, and the decisions behind where things run.",
    tags: ["infrastructure", "cloudflare", "deployment", "status", "dns", "monitoring", "docker", "stack"],
  },
  {
    slug: "design",
    label: "Design",
    description: "The visual language, motion, and the small details that carry it.",
    tags: ["design", "ux", "motion", "brand", "fonts", "accessibility", "svg"],
  },
  {
    slug: "product",
    label: "Product",
    description: "What PaceStreak does, and the reasoning behind how it works.",
    tags: ["product", "habits", "streaks", "gamification", "body", "units", "time", "launch", "roadmap", "social"],
  },
  {
    slug: "engineering",
    label: "Engineering",
    description: "Implementation notes: the code, the stack, and how it's built.",
    tags: [],
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
