/** Shared pagination math for the index and `/page/[page]`. One featured
    post plus a round dozen in the grid reads as a front page; every page
    after the first is just the dozen, since there's no hero slot to fill. */

export const PAGE_SIZE = 13;

export interface Page<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function paginate<T>(all: T[], currentPage: number, pageSize = PAGE_SIZE): Page<T> {
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  return {
    items: all.slice(start, start + pageSize),
    currentPage,
    totalPages,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}

/** Page numbers to render, with `null` standing in for an ellipsis. Always
    shows the first and last page, plus a window around the current one, so
    a 20-page archive doesn't print twenty buttons. */
export function pageWindow(currentPage: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set([1, 2, totalPages - 1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | null)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(null);
    result.push(sorted[i]);
  }
  return result;
}
