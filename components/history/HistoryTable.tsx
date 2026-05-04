"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Scan,
  Copy,
  Trash2,
  BarChart2,
  Pencil,
  RotateCcw,
  Loader2,
  QrCode as QrCodeIcon,
  Share2,
  Download,
} from "lucide-react";
import { deleteQr, resetQr } from "@/lib/actions/qr";
import { generateQrDataUrl } from "@/lib/qr-renderer";
import { truncate, formatDate } from "@/lib/utils";
import { useQrStore } from "@/store/qr-store";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import QrThumbnail from "@/components/ui/QrThumbnail";
import ResetConfirmDialog from "@/components/history/ResetConfirmDialog";
import QrDetailsModal from "@/components/history/QrDetailsModal";
import ShareModal from "@/components/history/ShareModal";
import type { IQrCode } from "@/types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface HistoryTableProps {
  items: IQrCode[];
}

// ── Row helpers ───────────────────────────────────────────────────────────────

function copyUrl(publicId: string) {
  const url = `${window.location.origin}/${publicId}`;
  navigator.clipboard
    .writeText(url)
    .then(() => toast.success("Copied to clipboard"))
    .catch(() => toast.error("Clipboard access denied"));
}

// ── Dialog target state ───────────────────────────────────────────────────────

interface TargetState {
  id: string;
  label: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HistoryTable({ items }: HistoryTableProps) {
  const router = useRouter();
  const { loadQrForEdit, setEditMode, editingId } = useQrStore();

  // Delete flow
  const [confirmTarget, setConfirmTarget] = useState<TargetState | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset flow
  const [resetTarget, setResetTarget] = useState<TargetState | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Details modal
  const [detailsTargetId, setDetailsTargetId] = useState<string | null>(null);
  const [detailsRefetchKey, setDetailsRefetchKey] = useState(0);

  // Share modal
  const [shareTarget, setShareTarget] = useState<{
    url: string;
    label: string;
  } | null>(null);

  // Edit navigation lock
  const [isNavigatingToEdit, setIsNavigatingToEdit] = useState(false);

  // Download loading state (keyed by QR _id)
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteQr(id);
      setConfirmTarget(null);

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        // Clear edit mode if the deleted QR was being edited
        if (editingId === id) setEditMode(null);
        toast.success("Deleted successfully");
      }
    });
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const handleEdit = (item: IQrCode) => {
    setIsNavigatingToEdit(true);
    loadQrForEdit(item);
    setEditMode(item._id);
    toast.success(`Editing: ${item.label ?? truncate(item.content, 25)}`);
    router.push("/generator");
  };

  // ── Download ────────────────────────────────────────────────────────────────

  const handleDownload = async (item: IQrCode) => {
    setDownloadingId(item._id);
    try {
      const dataUrl = await generateQrDataUrl({
        content: item.content,
        size: 512,
        foreground: item.foreground,
        background: item.background,
        dotStyle: item.dotStyle,
        cornerSquareStyle: item.cornerSquareStyle,
        cornerDotStyle: item.cornerDotStyle,
        cornerSquareColor: item.cornerSquareColor,
        cornerDotColor: item.cornerDotColor,
        logo: item.logo,
        logoSize: item.logoSize,
        logoBackgroundColor: item.logoBackgroundColor,
        margin: item.margin,
        errorCorrectionLevel: item.errorCorrectionLevel,
        borderWidth: item.borderWidth,
        borderColor: item.borderColor,
        borderPadding: item.borderPadding,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${item.label ?? item.publicId}.png`;
      a.click();
    } catch {
      toast.error("Failed to download QR code");
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = async (id: string) => {
    setResettingId(id);
    const result = await resetQr(id);
    setResettingId(null);
    setResetTarget(null);

    if ("error" in result && result.error) {
      toast.error(result.error ?? "Failed to reset stats.");
    } else {
      toast.success("Stats reset — scan count cleared");
      // If the details modal is open for this QR, trigger a refetch
      if (detailsTargetId === id) {
        setDetailsRefetchKey((k) => k + 1);
      }
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────

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

  // ── Table ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Delete confirmation */}
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

      {/* Reset confirmation */}
      {resetTarget && (
        <ResetConfirmDialog
          qrLabel={resetTarget.label}
          isLoading={resettingId !== null}
          onConfirm={() => void handleReset(resetTarget.id)}
          onCancel={() => {
            if (resettingId === null) setResetTarget(null);
          }}
        />
      )}

      {/* Details modal */}
      {detailsTargetId && (
        <QrDetailsModal
          qrId={detailsTargetId}
          refetchKey={detailsRefetchKey}
          onClose={() => setDetailsTargetId(null)}
        />
      )}

      {/* Share modal */}
      {shareTarget && (
        <ShareModal
          url={shareTarget.url}
          label={shareTarget.label}
          onClose={() => setShareTarget(null)}
        />
      )}

      {/* Responsive table */}
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
                    size={48}
                    foreground={item.foreground}
                    background={item.background}
                    dotStyle={item.dotStyle}
                    cornerSquareStyle={item.cornerSquareStyle}
                    cornerDotStyle={item.cornerDotStyle}
                    logo={item.logo}
                    logoSize={item.logoSize}
                    logoBackgroundColor={item.logoBackgroundColor}
                    margin={item.margin}
                    errorCorrectionLevel={item.errorCorrectionLevel}
                  />
                </td>

                {/* Type badge */}
                <td className="px-4 py-3">
                  <Badge type={item.type} />
                </td>

                {/* Content */}
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
                    {item.label ?? "—"}
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
                  <div className="flex items-center gap-0.5 justify-end">
                    {/* Download */}
                    <button
                      type="button"
                      title="Download QR code"
                      disabled={
                        isNavigatingToEdit ||
                        resettingId === item._id ||
                        downloadingId === item._id
                      }
                      onClick={() => void handleDownload(item)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {downloadingId === item._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>

                    {/* Copy URL */}
                    <button
                      type="button"
                      title="Copy scan URL"
                      disabled={isNavigatingToEdit || resettingId === item._id}
                      onClick={() => copyUrl(item.publicId)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Share */}
                    <button
                      type="button"
                      title="Share QR code"
                      disabled={isNavigatingToEdit || resettingId === item._id}
                      onClick={() =>
                        setShareTarget({
                          url: `${window.location.origin}/${item.publicId}`,
                          label: item.label ?? truncate(item.content, 40),
                        })
                      }
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Details */}
                    <button
                      type="button"
                      title="View details"
                      disabled={isNavigatingToEdit || resettingId === item._id}
                      onClick={() => setDetailsTargetId(item._id)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      title="Edit QR code"
                      disabled={isNavigatingToEdit || resettingId === item._id}
                      onClick={() => handleEdit(item)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Reset */}
                    <button
                      type="button"
                      title="Reset scan stats"
                      disabled={isNavigatingToEdit || resettingId === item._id}
                      onClick={() => {
                        if (item.scanCount === 0) {
                          toast("Nothing to reset — no scans recorded", {
                            icon: "⚠️",
                          });
                          return;
                        }
                        setResetTarget({
                          id: item._id,
                          label: item.label ?? truncate(item.content, 30),
                        });
                      }}
                      className="p-1.5 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {resettingId === item._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      title="Delete"
                      disabled={isNavigatingToEdit || resettingId === item._id}
                      onClick={() =>
                        setConfirmTarget({
                          id: item._id,
                          label: item.label ?? truncate(item.content, 30),
                        })
                      }
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
