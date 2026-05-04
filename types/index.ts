// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript interfaces for the QR Generator app
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums / unions ────────────────────────────────────────────────────────────

/** The four supported QR content types */
export type QrType = "URL" | "TEXT" | "EMAIL" | "PHONE";

export type DotStyle =
  | "square"
  | "rounded"
  | "dots"
  | "classy"
  | "classy-rounded"
  | "extra-rounded";

export type CornerSquareStyle = "none" | "dot" | "square" | "extra-rounded";
export type CornerDotStyle = "none" | "dot" | "square";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

// ── QR Customization ──────────────────────────────────────────────────────────

export interface IQrCustomization {
  size: number;
  foreground: string;
  background: string;
  dotStyle: DotStyle;
  cornerSquareStyle: CornerSquareStyle;
  cornerDotStyle: CornerDotStyle;
  /** Independent color for the 3 finder-pattern corner squares. */
  cornerSquareColor: string;
  /** Independent color for the inner dots of the corner squares. */
  cornerDotColor: string;
  logo?: string;
  logoSize: number;
  logoBackgroundColor: string;
  margin: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  /** Border width in px drawn around the outside of the QR. 0 = none. */
  borderWidth: number;
  /** Color of the border when borderWidth > 0. */
  borderColor: string;
  /** Padding in px between the inner edge of the border and the QR image. */
  borderPadding: number;
}

// ── Edit history ──────────────────────────────────────────────────────────────

export interface IEditHistoryEntry {
  editedAt: string; // ISO string after serialisation
  previousContent: string;
  previousLabel?: string;
  note?: string;
}

// ── Core QR code record ───────────────────────────────────────────────────────

/**
 * Plain-object representation of a QrCode document
 * (returned from the DB layer after serialisation).
 */
export interface IQrCode extends IQrCustomization {
  _id: string;
  publicId: string;
  type: QrType;
  content: string;
  label?: string;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
  editHistory: IEditHistoryEntry[];
  lastEditedAt?: string;
  isReset: boolean;
  resetAt?: string;
}

// ── Form state ────────────────────────────────────────────────────────────────

/**
 * Shape of the QR generator form — extends customization with
 * content fields. Used by Zustand store and Server Actions.
 */
export interface IQrFormState extends IQrCustomization {
  type: QrType;
  content: string;
  label: string;
}

// ── QR detail page ────────────────────────────────────────────────────────────

export interface IQrDetails {
  qr: IQrCode;
  scanTimeline: { date: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  recentScans: {
    scannedAt: string;
    deviceType: DeviceType;
    referer?: string;
    ip?: string;
  }[];
  editHistory: IEditHistoryEntry[];
}

// ── Dashboard aggregates ──────────────────────────────────────────────────────

export interface IQrTypeBreakdown {
  type: QrType;
  count: number;
}

export interface IQrOverTimeEntry {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export interface IQrStats {
  totalQrs: number;
  totalScans: number;
  editedCount: number;
  resetCount: number;
  qrsByType: IQrTypeBreakdown[];
  qrOverTime: IQrOverTimeEntry[];
  deviceBreakdown: { device: string; count: number }[];
  recentlyEdited: IQrCode[];
}

// ── API / pagination ──────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { data: T; error?: never }
  | { error: string; data?: never };

export interface IPaginatedQrList {
  data: IQrCode[];
  total: number;
  page: number;
  totalPages: number;
}
