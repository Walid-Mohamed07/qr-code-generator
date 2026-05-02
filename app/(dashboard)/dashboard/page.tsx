import type { Metadata } from 'next';
import { QrCode, Scan, Tag, Trophy } from 'lucide-react';
import { getQrStats, getTopQrs } from '@/lib/actions/qr';
import { truncate } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import QrOverTimeChart from '@/components/dashboard/QrOverTimeChart';
import QrTypeChart from '@/components/dashboard/QrTypeChart';
import TopQrsTable from '@/components/dashboard/TopQrsTable';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Monitor QR code generation and scan analytics.',
};

export default async function DashboardPage() {
  // Fetch stats and top QRs in parallel — neither depends on the other
  const [stats, topQrs] = await Promise.all([
    getQrStats(),
    getTopQrs(10),
  ]);

  // Derive "most used type" from the qrsByType breakdown
  const mostUsedType = stats.qrsByType.reduce(
    (best, cur) => (cur.count > (best?.count ?? -1) ? cur : best),
    stats.qrsByType[0] ?? null
  );

  // Top QR by scan count (topQrs is already sorted desc)
  const topQr = topQrs[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Real-time overview of your QR code activity.
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Total QR Codes"
          value={stats.totalQrs}
          icon={<QrCode className="w-5 h-5" />}
        />
        <StatCard
          label="Total Scans"
          value={stats.totalScans}
          icon={<Scan className="w-5 h-5" />}
        />
        <StatCard
          label="Most Used Type"
          value={mostUsedType?.type ?? '—'}
          subLabel={
            mostUsedType ? `${mostUsedType.count.toLocaleString()} codes` : undefined
          }
          icon={<Tag className="w-5 h-5" />}
        />
        <StatCard
          label="Top QR Code"
          value={topQr ? topQr.scanCount : 0}
          subLabel={
            topQr
              ? truncate(topQr.label ?? topQr.content, 28)
              : 'No QR codes yet'
          }
          icon={<Trophy className="w-5 h-5" />}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line chart — takes 2/3 width on large screens */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
            QR Codes Generated
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Last 30 days
          </p>
          <QrOverTimeChart data={stats.qrOverTime} />
        </div>

        {/* Donut chart — 1/3 width */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
            Distribution by Type
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            All time
          </p>
          <QrTypeChart data={stats.qrsByType} />
        </div>
      </div>

      {/* ── Top QRs table ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
          Top QR Codes
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Ranked by scan count
        </p>
        <TopQrsTable items={topQrs} />
      </div>
    </div>
  );
}
