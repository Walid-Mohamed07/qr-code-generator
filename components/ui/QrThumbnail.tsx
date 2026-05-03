'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import { generateQrDataUrl } from '@/lib/qr-renderer';
import type { IQrCustomization } from '@/types';

/**
 * All IQrCustomization fields are optional here so callers can pass only the
 * fields they have (e.g. the history table only passes foreground/background).
 * Missing fields are filled with the same defaults used by the store.
 */
interface QrThumbnailProps extends Partial<IQrCustomization> {
  content: string;
  /** Display size in px. Defaults to 48. QR is rendered at 128 px for crispness. */
  size?: number;
}

const QrThumbnail = memo(function QrThumbnail({
  content,
  size = 48,
  foreground = '#000000',
  background = '#FFFFFF',
  dotStyle = 'square',
  cornerSquareStyle = 'square',
  cornerDotStyle = 'square',
  logo,
  logoSize = 20,
  logoBackgroundColor = '#FFFFFF',
  margin = 4,
  errorCorrectionLevel = 'M',
}: QrThumbnailProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  // Build a stable opts object; rendered at 128 px for crispness regardless of display size
  const opts = useMemo(
    () => ({
      content,
      size: 128,
      foreground,
      background,
      dotStyle,
      cornerSquareStyle,
      cornerDotStyle,
      logo,
      logoSize,
      logoBackgroundColor,
      margin,
      errorCorrectionLevel,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      content,
      foreground,
      background,
      dotStyle,
      cornerSquareStyle,
      cornerDotStyle,
      logo,
      logoSize,
      logoBackgroundColor,
      margin,
      errorCorrectionLevel,
    ]
  );

  useEffect(() => {
    if (!content.trim()) return;
    let cancelled = false;
    generateQrDataUrl(opts)
      .then((url) => { if (!cancelled) setDataUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [opts, content]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded shrink-0 bg-gray-100 dark:bg-gray-700 animate-pulse"
        aria-label="QR code thumbnail loading"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code thumbnail"
      width={size}
      height={size}
      className="rounded shrink-0"
    />
  );
});

export default QrThumbnail;

