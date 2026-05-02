'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { IQrOverTimeEntry } from '@/types';

interface QrOverTimeChartProps {
  data: IQrOverTimeEntry[];
}

/**
 * Formats "2026-05-02" → "May 2" for the X-axis tick labels.
 */
function formatAxisDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Custom tooltip shown on hover.
 * Recharts passes an untyped payload so we type it minimally here.
 */
interface TooltipPayload {
  value: number;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-200">
        {formatAxisDate(label)}
      </p>
      <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
        {payload[0].value} QR{payload[0].value === 1 ? '' : 's'} generated
      </p>
    </div>
  );
}

export default function QrOverTimeChart({ data }: QrOverTimeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        No data for the last 30 days.
      </div>
    );
  }

  return (
    // ResponsiveContainer requires a fixed height on the parent
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-700"
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-gray-500 dark:text-gray-400"
            tickLine={false}
            axisLine={false}
            // Show a tick every ~5 days to avoid crowding on narrow screens
            interval={Math.max(0, Math.floor(data.length / 6) - 1)}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-gray-500 dark:text-gray-400"
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: '#6366f1' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
