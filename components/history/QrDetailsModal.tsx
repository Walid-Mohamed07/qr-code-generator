'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Scan as ScanIcon,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getQrDetails } from '@/lib/actions/qr';
import { generateQrDataUrl } from '@/lib/qr-renderer';
import { formatDate, truncate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { IQrDetails } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fills in missing days so the timeline always shows 30 entries. */
function buildFullTimeline(sparse: { date: string; count: number }[]) {
  const map = new Map(sparse.map((d) => [d.date, d.count]));
  const result: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    result.push({ date: key, count: map.get(key) ?? 0 });
  }
  return result;
}

const formatXTick = (val: string) => {
  // Use noon UTC to avoid timezone off-by-one issues
  const d = new Date(val + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const DEVICE_COLORS: Record<string, string> = {
  mobile: '#6366f1',
  desktop: '#10b981',
  tablet: '#f59e0b',
  unknown: '#9ca3af',
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

function ModalSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row gap-6">
        <Skeleton className="w-48 h-48 shrink-0 rounded-xl" />
        <div className="flex flex-col gap-3 flex-1 pt-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-8 w-24 mt-2" />
        </div>
      </div>
      {/* Charts skeleton */}
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      {/* Tables skeleton */}
      <div className="flex flex-col gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Detail pill ───────────────────────────────────────────────────────────────

function DetailPill({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">
      <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">
        {label}
      </span>
      <span className="font-medium text-gray-800 dark:text-gray-200">
        {children}
      </span>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
      {children}
    </h3>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface QrDetailsModalProps {
  qrId: string;
  onClose: () => void;
  /** Increment to trigger a data refetch without closing the modal. */
  refetchKey?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QrDetailsModal({ qrId, onClose, refetchKey }: QrDetailsModalProps) {
  const [details, setDetails] = useState<IQrDetails | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Fetch details on mount (and whenever refetchKey bumps)
  useEffect(() => {
    setDetails(null);
    setFetchError(null);
    getQrDetails(qrId).then((result) => {
      if ('error' in result) {
        setFetchError(result.error);
      } else {
        setDetails(result);
      }
    });
  }, [qrId, refetchKey]);

  // Generate styled QR preview once details are loaded
  const generatePreview = useCallback(async (det: IQrDetails) => {
    const scanUrl = `${window.location.origin}/${det.qr.publicId}`;
    try {
      const dataUrl = await generateQrDataUrl({ ...det.qr, content: scanUrl });
      setPreviewDataUrl(dataUrl);
    } catch {
      // Preview failure is non-critical; fall back gracefully
    }
  }, []);

  useEffect(() => {
    if (details) void generatePreview(details);
  }, [details, generatePreview]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCopyScanUrl = () => {
    if (!details) return;
    const url = `${window.location.origin}/${details.qr.publicId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="QR Details"
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:p-8">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl mb-8">

          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {details
                ? details.qr.label ?? truncate(details.qr.content, 40)
                : 'QR Details'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error state */}
          {fetchError && (
            <div className="p-12 text-center text-sm text-red-500 dark:text-red-400">
              {fetchError}
            </div>
          )}

          {/* Loading skeleton */}
          {!details && !fetchError && <ModalSkeleton />}

          {/* Main content */}
          {details && (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">

              {/* ── Section: Info header ─────────────────────────────────── */}
              <div className="px-6 py-6 flex flex-col sm:flex-row gap-6">
                {/* QR Preview */}
                <div className="shrink-0 flex flex-col items-center sm:items-start gap-2">
                  {previewDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewDataUrl}
                      alt="QR code preview"
                      width={details.qr.size}
                      height={details.qr.size}
                      className="rounded-xl border border-gray-200 dark:border-gray-700"
                      style={{ maxWidth: 192, maxHeight: 192 }}
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  )}
                  {previewDataUrl && (
                    <a
                      href={previewDataUrl}
                      download={`${details.qr.label ?? details.qr.publicId}.png`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PNG
                    </a>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-col gap-3 flex-1">
                  {/* Label + type */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {details.qr.label ?? 'Untitled'}
                    </span>
                    <Badge type={details.qr.type} />
                  </div>

                  {/* Scan URL */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/${details.qr.publicId}`}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyScanUrl}
                      title="Copy scan URL"
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                    >
                      {copiedUrl ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Created: {formatDate(details.qr.createdAt)}</span>
                    {details.qr.lastEditedAt && (
                      <span>
                        Last edited:{' '}
                        {formatDate(details.qr.lastEditedAt)}
                      </span>
                    )}
                  </div>

                  {/* Total scans */}
                  <div className="flex items-center gap-2 mt-1">
                    <ScanIcon className="w-4 h-4 text-indigo-500" />
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {details.qr.scanCount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      total scans
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Section: Scan Timeline ───────────────────────────────── */}
              <div className="px-6 py-6">
                <SectionHeading>Scan Timeline — Last 30 Days</SectionHeading>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={buildFullTimeline(details.scanTimeline)}
                      margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-gray-100 dark:text-gray-800"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatXTick}
                        tick={{ fontSize: 11 }}
                        interval={6}
                        stroke="currentColor"
                        className="text-gray-400"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                        stroke="currentColor"
                        className="text-gray-400"
                      />
                      <Tooltip
                        labelFormatter={(v) => formatXTick(v as string)}
                        formatter={(v: number) => [v, 'Scans']}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Section: Device Breakdown ────────────────────────────── */}
              <div className="px-6 py-6">
                <SectionHeading>Device Breakdown</SectionHeading>
                {details.deviceBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No device data yet.
                  </p>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={details.deviceBreakdown}
                          dataKey="count"
                          nameKey="device"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ device, percent }) =>
                            `${device} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {details.deviceBreakdown.map((entry) => (
                            <Cell
                              key={entry.device}
                              fill={
                                DEVICE_COLORS[entry.device] ??
                                DEVICE_COLORS.unknown
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number, name: string) => [v, name]}
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: '1px solid #e5e7eb',
                          }}
                        />
                        <Legend
                          formatter={(value) =>
                            value.charAt(0).toUpperCase() + value.slice(1)
                          }
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* ── Section: Recent Scans ────────────────────────────────── */}
              <div className="px-6 py-6">
                <SectionHeading>Recent Scans</SectionHeading>
                {details.recentScans.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No scans recorded yet. Share your QR code to start tracking.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            Time
                          </th>
                          <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                            Device
                          </th>
                          <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                            IP
                          </th>
                          <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">
                            Referer
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                        {details.recentScans.map((scan, i) => (
                          <tr
                            key={i}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            <td className="py-2 pr-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(scan.scannedAt)}
                            </td>
                            <td className="py-2 pr-4">
                              <span className="capitalize">{scan.deviceType}</span>
                            </td>
                            <td className="py-2 pr-4 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {scan.ip ?? '—'}
                            </td>
                            <td className="py-2 text-xs font-mono text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                              {scan.referer
                                ? truncate(scan.referer, 40)
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Section: Edit History ────────────────────────────────── */}
              <div className="px-6 py-6">
                <SectionHeading>Edit History</SectionHeading>
                {details.editHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No edits recorded.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-4">
                    {details.editHistory.map((entry, i) => (
                      <li key={i} className="flex gap-3">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          {i < details.editHistory.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-0.5 pb-4 min-w-0">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(entry.editedAt)}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                            {truncate(entry.previousContent, 60)}
                          </span>
                          {entry.note && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                              &ldquo;{entry.note}&rdquo;
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* ── Section: QR Settings ─────────────────────────────────── */}
              <div className="px-6 py-6">
                <SectionHeading>QR Settings</SectionHeading>
                <div className="flex flex-wrap gap-2">
                  <DetailPill label="Size">{details.qr.size}px</DetailPill>

                  <DetailPill label="Foreground">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-3.5 h-3.5 rounded-sm border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: details.qr.foreground }}
                      />
                      {details.qr.foreground.toUpperCase()}
                    </span>
                  </DetailPill>

                  <DetailPill label="Background">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-3.5 h-3.5 rounded-sm border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: details.qr.background }}
                      />
                      {details.qr.background.toUpperCase()}
                    </span>
                  </DetailPill>

                  <DetailPill label="Dots">{details.qr.dotStyle}</DetailPill>

                  <DetailPill label="Corners">
                    {details.qr.cornerSquareStyle}
                  </DetailPill>

                  <DetailPill label="Corner dots">
                    {details.qr.cornerDotStyle}
                  </DetailPill>

                  <DetailPill label="ECL">
                    {details.qr.errorCorrectionLevel}
                  </DetailPill>

                  <DetailPill label="Margin">
                    {details.qr.margin} modules
                  </DetailPill>

                  <DetailPill label="Logo">
                    {details.qr.logo
                      ? `Yes (${details.qr.logoSize}%)`
                      : 'None'}
                  </DetailPill>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
