'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

/**
 * URL-based pagination: each page link updates `?page=N` in the URL.
 * Server Component re-renders and fetches the correct slice.
 *
 * Shows at most 5 page buttons with ellipsis on either side when there
 * are many pages.
 */
export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const buildHref = (page: number) => `${pathname}?page=${page}`;

  // ── Build visible page numbers ────────────────────────────────────────────
  // Always show first, last, current, and one neighbour on each side.
  // Fill gaps with null (rendered as "…").

  const getPageNumbers = (): (number | null)[] => {
    const delta = 1; // neighbours on each side of current
    const range: number[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    const pages: (number | null)[] = [1];

    if (range[0] > 2) pages.push(null); // left ellipsis
    pages.push(...range);
    if (range[range.length - 1] < totalPages - 1) pages.push(null); // right ellipsis
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();

  const btnBase =
    'inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-md text-sm font-medium transition-colors';
  const btnActive =
    'bg-indigo-600 text-white';
  const btnInactive =
    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
  const btnDisabled =
    'text-gray-300 dark:text-gray-600 cursor-not-allowed pointer-events-none';

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-6 flex-wrap"
    >
      {/* Previous */}
      {currentPage <= 1 ? (
        <span className={cn(btnBase, btnDisabled)} aria-disabled="true">
          <ChevronLeft className="w-4 h-4" />
          <span className="sr-only">Previous</span>
        </span>
      ) : (
        <Link href={buildHref(currentPage - 1)} className={cn(btnBase, btnInactive)}>
          <ChevronLeft className="w-4 h-4" />
          <span className="sr-only">Previous</span>
        </Link>
      )}

      {/* Page numbers */}
      {pages.map((page, idx) =>
        page === null ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center min-w-[2rem] h-8 text-sm text-gray-400"
          >
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(btnBase, page === currentPage ? btnActive : btnInactive)}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage >= totalPages ? (
        <span className={cn(btnBase, btnDisabled)} aria-disabled="true">
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Next</span>
        </span>
      ) : (
        <Link href={buildHref(currentPage + 1)} className={cn(btnBase, btnInactive)}>
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Next</span>
        </Link>
      )}
    </nav>
  );
}
