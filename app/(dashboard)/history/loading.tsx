/**
 * Shown by Next.js while the history page's async Server Component
 * is fetching data. Uses Tailwind animate-pulse for skeleton shimmer.
 */
export default function HistoryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded-md" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
          {[14, 12, 40, 20, 12, 24].map((w, i) => (
            <div
              key={i}
              className={`h-3.5 bg-gray-200 dark:bg-gray-700 rounded`}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        {/* 10 skeleton rows */}
        {Array.from({ length: 10 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
          >
            {/* QR thumbnail */}
            <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 shrink-0" />
            {/* Type badge */}
            <div className="h-5 w-14 bg-gray-100 dark:bg-gray-700 rounded-full" />
            {/* Content */}
            <div className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded flex-1 max-w-[200px]" />
            {/* Label — hidden on mobile */}
            <div className="h-3.5 w-20 bg-gray-100 dark:bg-gray-700 rounded hidden md:block" />
            {/* Scans */}
            <div className="h-3.5 w-10 bg-gray-100 dark:bg-gray-700 rounded" />
            {/* Created — hidden on small */}
            <div className="h-3.5 w-24 bg-gray-100 dark:bg-gray-700 rounded hidden lg:block" />
            {/* Actions */}
            <div className="flex gap-1 ml-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-7 h-7 rounded bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-center gap-2 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}
