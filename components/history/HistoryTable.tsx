'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Scan, Copy, Download, Trash2, QrCode as QrCodeIcon } from 'lucide-react';
import { deleteQr } from '@/lib/actions/qr';
import { truncate, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import QrThumbnail from '@/components/ui/QrThumbnail';
import type { IQrCode } from '@/types';
import QRCode from 'qrcode';

// ── Props ─────────────────────────────────────────────────────────────────────

interface HistoryTableProps {
  items: IQrCode[];
}

// ── Row actions ───────────────────────────────────────────────────────────────

function copyUrl(publicId: string) {
  const url = `${window.location.origin}/${publicId}`;
  navigator.clipboard
    .writeText(url)
    .then(() => toast.success('Copied to clipboard'))
    .catch(() => toast.error('Clipboard access denied'));
}

async function downloadPng(item: IQrCode) {
  try {
    // Encode the scan tracking URL so scanning the downloaded QR
    // routes through /api/scan/[publicId] and increments the count.
    const scanUrl = `${window.location.origin}/${item.publicId}`;
    const dataUrl = await QRCode.toDataURL(scanUrl, {
      width: item.size,
      color: { dark: item.foreground, light: item.background },
      margin: 2,
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-${item.publicId}.png`;
    a.click();
    toast.success('PNG downloaded');
  } catch {
    toast.error('Failed to generate PNG');
  }
}

// ── Delete confirmation row state ─────────────────────────────────────────────

interface ConfirmState {
  id: string;
  label: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HistoryTable({ items }: HistoryTableProps) {
  const [confirmTarget, setConfirmTarget] = useState<ConfirmState | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteQr(id);
      setConfirmTarget(null);

      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success('Deleted successfully');
      }
    });
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<QrCodeIcon className="w-16 h-16" />}
        title="No QR codes yet"
        description="Generate your first QR code and it will appear here."
        cta={
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <QrCodeIcon className="w-4 h-4" />
            Generate your first QR code
          </Link>
        }
      />
    );
  }

  return (
    <>
      {/* Confirm delete dialog */}
      {confirmTarget && (
        <ConfirmDialog
          title="Delete QR Code"
          message={`Are you sure you want to delete "${confirmTarget.label}"? This will also remove all scan history. This action cannot be undone.`}
          confirmLabel="Delete"
          isLoading={isPending}
          onConfirm={() => handleDelete(confirmTarget.id)}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {/* Responsive table wrapper */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 w-14">
                QR
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                Type
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                Content
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                Label
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                Scans
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                Created
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {items.map((item) => (
              <tr
                key={item._id}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                {/* Thumbnail */}
                <td className="px-4 py-3">
                  <QrThumbnail
                    content={item.content}
                    foreground={item.foreground}
                    background={item.background}
                    size={48}
                  />
                </td>

                {/* Type badge */}
                <td className="px-4 py-3">
                  <Badge type={item.type} />
                </td>

                {/* Content — truncated with full value in title tooltip */}
                <td className="px-4 py-3 max-w-[200px]">
                  <span
                    title={item.content}
                    className="block truncate text-gray-800 dark:text-gray-200 font-mono text-xs"
                  >
                    {truncate(item.content, 40)}
                  </span>
                </td>

                {/* Label */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.label ?? '—'}
                  </span>
                </td>

                {/* Scan count */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                    <Scan className="w-3.5 h-3.5 text-gray-400" />
                    {item.scanCount.toLocaleString()}
                  </span>
                </td>

                {/* Created date */}
                <td className="px-4 py-3 hidden lg:table-cell text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(item.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      type="button"
                      title="Copy scan URL"
                      onClick={() => copyUrl(item.publicId)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Download PNG"
                      onClick={() => void downloadPng(item)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() =>
                        setConfirmTarget({
                          id: item._id,
                          label: item.label ?? truncate(item.content, 30),
                        })
                      }
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
