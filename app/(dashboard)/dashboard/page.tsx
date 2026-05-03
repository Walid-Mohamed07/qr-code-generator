import type { Metadata } from 'next';
import { QrCode, Scan, Tag, Trophy, Pencil } from 'lucide-react';
import { getQrStats, getTopQrs } from '@/lib/actions/qr';
import { truncate, formatDate } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import QrOverTimeChart from '@/components/dashboard/QrOverTimeChart';
import QrTypeChart from '@/components/dashboard/QrTypeChart';
import TopQrsTable from '@/components/dashboard/TopQrsTable';
import DeviceBreakdownChart from '@/components/dashboard/DeviceBreakdownChart';
import Badge from '@/components/ui/Badge';

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
        <StatCard
          label="QR Codes Edited"
          value={stats.editedCount}
          subLabel={stats.editedCount === 1 ? '1 code modified' : `${stats.editedCount} codes modified`}
          icon={<Pencil className="w-5 h-5" />}
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

      {/* ── Device breakdown chart ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
          Scans by Device
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          All time
        </p>
        <DeviceBreakdownChart data={stats.deviceBreakdown} />
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

      {/* ── Recently Edited ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
          Recently Edited
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Last 5 modified QR codes
        </p>

        {stats.recentlyEdited.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
            No QR codes have been edited yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                    QR Code
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    Last Edited
                  </th>
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">
                    Edits
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {stats.recentlyEdited.map((qr) => (
                  <tr key={qr._id} className="text-gray-700 dark:text-gray-300">
                    <td className="py-2 pr-4 max-w-[200px]">
                      <span
                        title={qr.content}
                        className="block truncate font-medium"
                      >
                        {qr.label ?? truncate(qr.content, 36)}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge type={qr.type} />
                    </td>
                    <td className="py-2 pr-4 hidden sm:table-cell text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {qr.lastEditedAt ? formatDate(qr.lastEditedAt) : '—'}
                    </td>
                    <td className="py-2 text-xs text-gray-500 dark:text-gray-400">
                      {qr.editHistory.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
