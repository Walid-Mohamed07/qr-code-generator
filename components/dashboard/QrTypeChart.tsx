'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { IQrTypeBreakdown } from '@/types';
import type { QrType } from '@/types';

interface QrTypeChartProps {
  data: IQrTypeBreakdown[];
}

const TYPE_COLORS: Record<QrType, string> = {
  URL: '#3b82f6',    // blue-500
  TEXT: '#22c55e',   // green-500
  EMAIL: '#a855f7',  // purple-500
  PHONE: '#f97316',  // orange-500
};

/**
 * Custom tooltip showing count + percentage.
 */
interface TooltipPayload {
  name: string;
  value: number;
  payload: { percent: number };
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const pct = (entry.payload.percent * 100).toFixed(1);
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-800 dark:text-gray-100">{entry.name}</p>
      <p className="text-gray-600 dark:text-gray-300">
        {entry.value} QR{entry.value === 1 ? '' : 's'} ({pct}%)
      </p>
    </div>
  );
}

/**
 * Custom legend rendered below the chart.
 * Recharts' default legend doesn't respect Tailwind dark mode so we
 * render our own.
 */
interface LegendPayloadItem {
  value: string;
  color: string;
}
interface CustomLegendProps {
  payload?: LegendPayloadItem[];
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-3 mt-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function QrTypeChart({ data }: QrTypeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        No data available.
      </div>
    );
  }

  // Recharts Pie needs a `name` field for the legend/tooltip
  const chartData = data.map((d) => ({
    name: d.type,
    value: d.count,
    color: TYPE_COLORS[d.type] ?? '#94a3b8',
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius="50%"   // donut style
            outerRadius="75%"
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
