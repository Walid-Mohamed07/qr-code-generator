import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  /** e.g. "+12%" — positive shows green, negative shows red */
  trend?: string;
  /** Sub-label shown below the main value */
  subLabel?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  subLabel,
}: StatCardProps) {
  const isPositiveTrend = trend ? !trend.startsWith('-') : null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm flex flex-col gap-4">
      {/* Icon + trend row */}
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              isPositiveTrend
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {isPositiveTrend ? '↑' : '↓'} {trend.replace(/^[+-]/, '')}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subLabel && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {subLabel}
          </p>
        )}
      </div>

      {/* Label */}
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 -mt-2">
        {label}
      </p>
    </div>
  );
}
