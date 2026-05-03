'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { Download, Copy, QrCode as QrCodeIcon } from 'lucide-react';
import { useQrStore } from '@/store/qr-store';

// ── Props ─────────────────────────────────────────────────────────────────────

interface QrPreviewPanelProps {
  /** publicId of the most recently saved QR code, or null if unsaved */
  savedPublicId: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QrPreviewPanel({ savedPublicId }: QrPreviewPanelProps) {
  const { previewDataUrl, isGenerating, formState } = useQrStore();

  // After save, regenerate the QR image encoding the scan tracking URL so
  // that scanning the downloaded/displayed QR actually hits /api/scan/[id]
  // and increments the scan count.
  const [savedQrDataUrl, setSavedQrDataUrl] = useState<string | null>(null);

  const scanUrl = savedPublicId
    ? `${window.location.origin}/${savedPublicId}`
    : null;

  useEffect(() => {
    if (!scanUrl) {
      setSavedQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(scanUrl, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then(setSavedQrDataUrl)
      .catch(() => setSavedQrDataUrl(null));
  }, [scanUrl]);

  // Use the scan-URL QR after save; fall back to live preview while editing.
  const displayDataUrl = savedQrDataUrl ?? previewDataUrl;
  const hasPreview = !!displayDataUrl;

  // ── Download PNG ─────────────────────────────────────────────────────────────

  const downloadPng = () => {
    if (!displayDataUrl) return;
    const a = document.createElement('a');
    a.href = displayDataUrl;
    a.download = `qr-${Date.now()}.png`;
    a.click();
    toast.success('PNG downloaded');
  };

  // ── Download SVG ─────────────────────────────────────────────────────────────
  // Re-generates from the qrcode library with svg type so we get a proper
  // vector file rather than converting the raster canvas output.

  const downloadSvg = async () => {
    // After save, encode the scan URL; before save, encode the raw content.
    const svgContent = scanUrl ?? formState.content;
    if (!svgContent.trim()) return;
    try {
      const svg = await QRCode.toString(svgContent, {
        type: 'svg',
        color: { dark: formState.foreground, light: formState.background },
        width: formState.size,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${Date.now()}.svg`;
      a.click();
      // Revoke after a tick so the browser has time to start the download
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast.success('SVG downloaded');
    } catch (err) {
      console.error('[downloadSvg]', err);
      toast.error('Failed to generate SVG');
    }
  };

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  // Uses the Clipboard API with ClipboardItem for image/png.
  // Falls back to writing the data URL as text for environments that don't
  // support ClipboardItem (e.g. Firefox without about:config flag).

  const copyToClipboard = async () => {
    if (!displayDataUrl) return;
    try {
      const res = await fetch(displayDataUrl);
      const blob = await res.blob();

      if (typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } else {
        // Fallback: write the base64 PNG data URL as text
        await navigator.clipboard.writeText(displayDataUrl!);
      }

      toast.success('Copied to clipboard');
    } catch (err) {
      console.error('[copyToClipboard]', err);
      toast.error('Clipboard access denied');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      {/* QR preview area */}
      <div className="w-full max-w-xs mx-auto aspect-square flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
        {isGenerating && (
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Generating…</span>
          </div>
        )}

        {!isGenerating && hasPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayDataUrl!}
            alt="QR Code preview"
            className="w-full h-full object-contain p-4"
          />
        )}

        {!isGenerating && !hasPreview && (
          <div className="flex flex-col items-center gap-3 text-gray-400 p-8 text-center">
            <QrCodeIcon className="w-16 h-16 opacity-25" />
            {formState.content.trim() ? (
              <>
                <p className="text-sm font-medium">No preview yet</p>
                <p className="text-xs leading-relaxed">
                  Wait 400ms for auto-generation.
                </p>
              </>
            ) : (
              <p className="text-sm font-medium">Enter content to preview QR</p>
            )}
          </div>
        )}
      </div>

      {/* Download / copy buttons */}
      <div className="flex gap-3 w-full">
        <button
          type="button"
          disabled={!hasPreview}
          onClick={downloadPng}
          title="Download PNG"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          PNG
        </button>

        <button
          type="button"
          disabled={!hasPreview}
          onClick={() => void downloadSvg()}
          title="Download SVG"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          SVG
        </button>

        <button
          type="button"
          disabled={!hasPreview}
          onClick={() => void copyToClipboard()}
          title="Copy to clipboard"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
      </div>

      {/* Saved QR scan URL */}
      {scanUrl && (
        <div className="w-full rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 space-y-1">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400">
            Saved! Public scan URL:
          </p>
          <p className="text-xs font-mono text-green-800 dark:text-green-300 break-all select-all">
            {scanUrl}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(scanUrl).then(() => {
                toast.success('Copied to clipboard');
              });
            }}
            className="mt-2 text-xs text-green-700 dark:text-green-400 underline hover:no-underline"
          >
            Copy URL
          </button>
        </div>
      )}
    </div>
  );
}
