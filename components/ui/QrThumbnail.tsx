'use client';

import { useEffect, useRef, memo } from 'react';
import QRCode from 'qrcode';

interface QrThumbnailProps {
  content: string;
  foreground?: string;
  background?: string;
  /** Rendered canvas size in px. Defaults to 48. */
  size?: number;
}

/**
 * Renders a small QR code canvas from the given content string.
 * Memoised so re-renders of parent list rows don't re-draw the canvas
 * unless the content or colour props actually change.
 */
const QrThumbnail = memo(function QrThumbnail({
  content,
  foreground = '#000000',
  background = '#FFFFFF',
  size = 48,
}: QrThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !content.trim()) return;

    QRCode.toCanvas(canvas, content, {
      width: size,
      color: { dark: foreground, light: background },
      margin: 1,
      errorCorrectionLevel: 'L', // Low correction = denser, more compact at small sizes
    }).catch((err) => {
      console.error('[QrThumbnail]', err);
    });
  }, [content, foreground, background, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded shrink-0"
      aria-label="QR code thumbnail"
    />
  );
});

export default QrThumbnail;
