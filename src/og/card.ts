// Per-post share cards, rendered at BUILD time into static PNGs.
//
// Satori lays the card out and resvg rasterises it. Both run only during
// `astro build`, so nothing here ships to the browser and the CSP is
// untouched. The font is vendored (Archivo static cuts made from the site's
// variable font, OFL; Noto Sans is kept for reference - see fonts/OFL.txt)
// because the build machine's fonts are unknown and resvg draws nothing for
// text without one.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

// Resolved from the project root, not import.meta.url: Astro bundles this
// module into dist/.prerender/, where a relative URL points at nothing.
const font = (file: string) =>
  readFileSync(resolve(process.cwd(), "src/og/fonts", file));
const regular = font("Archivo-Regular.ttf");
const bold = font("Archivo-BoldCondensed.ttf");

const BG = "#0a0a0b";
const INK = "#f4f4f5";
const MUTED = "#a1a1aa";
const ACCENT = "#d3ff3e";

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra: Record<string, unknown> = {},
): Node => ({
  type,
  props: { style, children, ...extra },
});

export interface CardInput {
  title: string;
  meta: string; // "25 September 2026 · 6 min read"
  tags: string[];
}

export async function renderCard({ title, meta, tags }: CardInput): Promise<Buffer> {
  // Long titles step down a size instead of overflowing the card.
  const size = title.length > 70 ? 54 : title.length > 45 ? 62 : 72;
  const tree = h(
    "div",
    {
      width: 1200,
      height: 630,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px 80px",
      background: BG,
      fontFamily: "Archivo",
    },
    [
      h("div", { display: "flex", alignItems: "center", gap: 18 }, [
        h(
          "svg",
          { width: 44, height: 44 },
          [
            h("rect", {}, undefined, { x: 6, y: 9, width: 52, height: 49, rx: 5, fill: "#141417", stroke: INK, "stroke-width": 3 }),
            h("path", {}, undefined, { d: "M6 14a5 5 0 0 1 5-5h42a5 5 0 0 1 5 5v7H6z", fill: ACCENT, stroke: INK, "stroke-width": 3 }),
            h("path", {}, undefined, { d: "M21 5v9M43 5v9", stroke: INK, "stroke-width": 4, "stroke-linecap": "round" }),
            h("path", {}, undefined, { d: "M19.5 29.5c8 6 16 13.5 25 21.5M45 29c-9.5 7-17 14-25 21.5", fill: "none", stroke: ACCENT, "stroke-width": 6, "stroke-linecap": "round" }),
          ],
          { viewBox: "0 0 64 64" },
        ),
        h("div", { display: "flex", fontSize: 32, fontWeight: 700, color: INK }, [
          h("span", {}, "Pace"),
          h("span", { color: ACCENT }, "Streak"),
          h("span", { marginLeft: 14, fontWeight: 400, color: MUTED }, "blog"),
        ]),
      ]),
      h(
        "div",
        {
          display: "flex",
          fontSize: size,
          fontWeight: 700,
          color: INK,
          lineHeight: 1.12,
          letterSpacing: -1.5,
        },
        title,
      ),
      h(
        "div",
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 26,
          color: MUTED,
        },
        [
          h("span", {}, meta),
          h(
            "div",
            { display: "flex", gap: 12 },
            tags.slice(0, 3).map((t) =>
              h(
                "span",
                {
                  border: `2px solid #34343d`,
                  borderRadius: 999,
                  padding: "4px 16px",
                  fontSize: 22,
                },
                t,
              ),
            ),
          ),
        ],
      ),
    ],
  );
  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Archivo", data: regular, weight: 400, style: "normal" },
      { name: "Archivo", data: bold, weight: 700, style: "normal" },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}
