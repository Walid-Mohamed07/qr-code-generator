'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ── Color map ─────────────────────────────────────────────────────────────────

const COLORS: Record<string, string> = {
  mobile: '#3b82f6',   // blue-500
  desktop: '#10b981',  // emerald-500
  tablet: '#a855f7',   // purple-500
  unknown: '#9ca3af',  // gray-400
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface DeviceBreakdownChartProps {
  data: { device: string; count: number }[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DeviceBreakdownChart({ data }: DeviceBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
        No scan data yet.
      </div>
    );
  }

  // Capitalise labels for display
  const displayData = data.map((d) => ({
    ...d,
    label: d.device.charAt(0).toUpperCase() + d.device.slice(1),
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={displayData}
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-800"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-gray-400"
          />
          <YAxis
            type="category"
            dataKey="label"
            width={64}
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            className="text-gray-500"
          />
          <Tooltip
            formatter={(v: number) => [v.toLocaleString(), 'Scans']}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {displayData.map((entry) => (
              <Cell
                key={entry.device}
                fill={COLORS[entry.device] ?? COLORS.unknown}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
