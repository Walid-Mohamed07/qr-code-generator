/**
 * Shown by Next.js while the dashboard page's async Server Component
 * is fetching stats and top QRs.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="h-4 w-56 bg-gray-100 dark:bg-gray-800 rounded-md" />
      </div>

      {/* ── Stat cards row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4 shadow-sm"
          >
            {/* Icon placeholder */}
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700" />
            {/* Value */}
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
            {/* Label */}
            <div className="h-3.5 w-32 bg-gray-100 dark:bg-gray-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line chart skeleton — 2/3 */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-3">
          <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded-md" />
          <div className="h-3.5 w-20 bg-gray-100 dark:bg-gray-800 rounded-md" />
          {/* Chart area */}
          <div className="h-64 w-full rounded-lg bg-gray-50 dark:bg-gray-700/30 mt-2" />
        </div>

        {/* Donut chart skeleton — 1/3 */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-3">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-md" />
          <div className="h-3.5 w-16 bg-gray-100 dark:bg-gray-800 rounded-md" />
          {/* Donut placeholder */}
          <div className="flex items-center justify-center h-52 mt-2">
            <div className="w-36 h-36 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800" />
            </div>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-3 flex-wrap mt-1">
            {[14, 16, 18, 16].map((w, i) => (
              <div key={i} className={`h-3 rounded-full bg-gray-100 dark:bg-gray-700`} style={{ width: `${w * 4}px` }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Top QRs table skeleton ───────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4">
        <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="h-3.5 w-36 bg-gray-100 dark:bg-gray-800 rounded-md" />

        <div className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden mt-2">
          {/* Header */}
          <div className="flex gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
            {[4, 8, 50, 14, 10].map((w, i) => (
              <div key={i} className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
          {/* 10 rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
              <div className="w-5 h-3.5 bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-gray-100 dark:bg-gray-700 rounded" />
                <div className="h-2.5 w-40 bg-gray-50 dark:bg-gray-700/60 rounded" />
              </div>
              <div className="h-5 w-14 bg-gray-100 dark:bg-gray-700 rounded-full" />
              <div className="h-3.5 w-10 bg-gray-100 dark:bg-gray-700 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
