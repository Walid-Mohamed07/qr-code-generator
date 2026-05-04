/**
 * QR Rendering Engine — client-side only.
 *
 * Wraps `qr-code-styling` (dynamically imported to avoid SSR errors)
 * and maps our IQrCustomization fields to the library's option shapes.
 *
 * All exports are async because qr-code-styling requires browser APIs
 * (Canvas, Blob, URL.createObjectURL) that are not available on the server.
 */

import type { IQrCustomization } from "@/types";
import type {
  Options,
  DotType,
  CornerSquareType,
  CornerDotType,
} from "qr-code-styling";

// ── Type mappers ──────────────────────────────────────────────────────────────

/**
 * Our DotStyle includes 'square' which maps to 'square' in qr-code-styling.
 * All other values are identical strings — the cast is safe.
 */
function mapDotType(style: IQrCustomization["dotStyle"]): DotType {
  return style as DotType;
}

/**
 * Our CornerSquareStyle 'none' has no equivalent; fall back to 'square'.
 */
function mapCornerSquareType(
  style: IQrCustomization["cornerSquareStyle"],
): CornerSquareType | undefined {
  if (style === "none") return undefined;
  return style as CornerSquareType;
}

/**
 * Our CornerDotStyle 'none' has no equivalent; fall back to undefined
 * so the library uses its default (inherits from dotsOptions).
 */
function mapCornerDotType(
  style: IQrCustomization["cornerDotStyle"],
): CornerDotType | undefined {
  if (style === "none") return undefined;
  return style as CornerDotType;
}

// ── Build Options object ──────────────────────────────────────────────────────

function buildOptions(opts: IQrCustomization & { content: string }): Options {
  const {
    content,
    size,
    foreground,
    background,
    dotStyle,
    cornerSquareStyle,
    cornerDotStyle,
    cornerSquareColor,
    cornerDotColor,
    logo,
    logoSize,
    logoBackgroundColor,
    margin,
    errorCorrectionLevel,
  } = opts;

  const options: Options = {
    width: size,
    height: size,
    data: content,
    margin,
    qrOptions: {
      errorCorrectionLevel,
    },
    dotsOptions: {
      type: mapDotType(dotStyle),
      color: foreground,
    },
    cornersSquareOptions: {
      type: mapCornerSquareType(cornerSquareStyle),
      color: cornerSquareColor,
    },
    cornersDotOptions: {
      type: mapCornerDotType(cornerDotStyle),
      color: cornerDotColor,
    },
    backgroundOptions: {
      color: background,
    },
  };

  if (logo) {
    options.image = logo;
    options.imageOptions = {
      hideBackgroundDots: true,
      // logoSize is a percentage (10–40); library expects 0–1 fraction
      imageSize: logoSize / 100,
      margin: 2,
      // Allow cross-origin logos (data URLs don't need this, but external URLs do)
      crossOrigin: "anonymous",
    };
    // Logo backing colour — applied via backgroundOptions on the image container;
    // qr-code-styling doesn't have a direct logoBackgroundColor option so we
    // store it for use by callers that render to canvas and paint it manually.
    // The value is kept in opts so callers can use it if needed.
    void logoBackgroundColor;
  }

  return options;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a QR code and return it as a PNG data URL (base64).
 * Safe to call from `useEffect` / event handlers — never on the server.
 */
export async function generateQrDataUrl(
  opts: IQrCustomization & { content: string },
): Promise<string> {
  const {
    size,
    borderWidth,
    borderColor,
    borderPadding,
    borderOuterPadding,
    background,
  } = opts;
  const QRCodeStyling = (await import("qr-code-styling")).default;

  // When a border or padding is requested, render the QR at the inner (smaller)
  // size, then composite it onto a full-size canvas filled with the border colour.
  const qrOffset = borderOuterPadding + borderWidth + borderPadding;
  const innerSize = qrOffset > 0 ? Math.max(64, size - qrOffset * 2) : size;
  const renderOpts = qrOffset > 0 ? { ...opts, size: innerSize } : opts;

  const qr = new QRCodeStyling({ ...buildOptions(renderOpts), type: "canvas" });

  const blob = await qr.getRawData("png");
  if (!blob) throw new Error("QR generation returned no data");

  const innerDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read QR blob"));
    reader.readAsDataURL(blob as Blob);
  });

  if (qrOffset <= 0) return innerDataUrl;

  // Composite the QR image onto a bordered + padded canvas
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      // Outer padding region uses the QR background colour
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size, size);
      // Border + inner padding region uses the border colour
      ctx.fillStyle = borderColor;
      ctx.fillRect(
        borderOuterPadding,
        borderOuterPadding,
        size - 2 * borderOuterPadding,
        size - 2 * borderOuterPadding,
      );
      ctx.drawImage(img, qrOffset, qrOffset, innerSize, innerSize);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () =>
      reject(new Error("Failed to load QR image for border compositing"));
    img.src = innerDataUrl;
  });
}

/**
 * Generate a QR code and return it as an SVG string.
 * Useful for vector downloads.
 */
export async function generateQrSvgString(
  opts: IQrCustomization & { content: string },
): Promise<string> {
  const QRCodeStyling = (await import("qr-code-styling")).default;

  const qr = new QRCodeStyling({ ...buildOptions(opts), type: "svg" });

  const blob = await qr.getRawData("svg");
  if (!blob) throw new Error("QR SVG generation returned no data");

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read SVG blob"));
    reader.readAsText(blob as Blob);
  });
}

/**
 * Render the QR code directly onto a provided HTMLCanvasElement.
 * Used for the live preview panel — avoids an intermediate blob round-trip.
 */
export async function drawQrToCanvas(
  canvas: HTMLCanvasElement,
  opts: IQrCustomization & { content: string },
): Promise<void> {
  const QRCodeStyling = (await import("qr-code-styling")).default;

  // qr-code-styling renders by appending into a container element.
  // We create a temporary off-screen div, append there, then copy the
  // resulting canvas pixels into the caller's canvas.
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.visibility = "hidden";
  // Must be in the DOM for the library to measure / render correctly
  document.body.appendChild(container);

  try {
    const qr = new QRCodeStyling({ ...buildOptions(opts), type: "canvas" });
    qr.append(container);

    // Wait for the async drawing promise to finish
    // The library attaches a canvas child — poll briefly for it
    await new Promise<void>((resolve) => {
      const start = Date.now();
      const check = () => {
        const child = container.querySelector("canvas");
        if (child || Date.now() - start > 3000) resolve();
        else requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });

    const sourceCanvas = container.querySelector("canvas");
    if (!sourceCanvas) throw new Error("QR canvas not found after render");

    // Copy pixels to the caller's canvas
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context");
    ctx.drawImage(sourceCanvas, 0, 0);
  } finally {
    document.body.removeChild(container);
  }
}
