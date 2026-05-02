import { Scan } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import QrThumbnail from '@/components/ui/QrThumbnail';
import { truncate } from '@/lib/utils';
import type { IQrCode } from '@/types';

interface TopQrsTableProps {
  items: IQrCode[];
}

/**
 * Server Component — no interactivity needed, just a ranked table.
 * QrThumbnail is a Client Component but can be used inside a Server
 * Component; Next.js handles the boundary automatically.
 */
export default function TopQrsTable({ items }: TopQrsTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
        No QR codes yet.
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 w-10">
              #
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 w-14">
              QR
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
              Content
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
              Type
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">
              Scans
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {items.map((item, index) => (
            <tr
              key={item._id}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              {/* Rank */}
              <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs">
                {index + 1}
              </td>

              {/* QR thumbnail */}
              <td className="px-4 py-3">
                <QrThumbnail
                  content={item.content}
                  foreground={item.foreground}
                  background={item.background}
                  size={40}
                />
              </td>

              {/* Content */}
              <td className="px-4 py-3 max-w-[220px]">
                {item.label && (
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                    {item.label}
                  </p>
                )}
                <p
                  title={item.content}
                  className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate"
                >
                  {truncate(item.content, 45)}
                </p>
              </td>

              {/* Type badge */}
              <td className="px-4 py-3">
                <Badge type={item.type} />
              </td>

              {/* Scan count */}
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1 justify-end font-semibold text-gray-800 dark:text-gray-200">
                  <Scan className="w-3.5 h-3.5 text-indigo-400" />
                  {item.scanCount.toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
