// ─────────────────────────────────────────────
// Shared TypeScript interfaces for the QR Generator app
// ─────────────────────────────────────────────

/** The four supported QR content types */
export type QrType = 'URL' | 'TEXT' | 'EMAIL' | 'PHONE';

/**
 * Plain-object representation of a QrCode document
 * (returned from the DB layer after serialisation).
 * _id is a string because Mongoose ObjectIds are serialised
 * to strings when passed from Server Components to Client Components.
 */
export interface IQrCode {
  _id: string;
  publicId: string;
  type: QrType;
  content: string;
  label?: string;
  foreground: string;
  background: string;
  size: number;
  scanCount: number;
  createdAt: string; // ISO 8601 string after JSON serialisation
  updatedAt: string;
}

/**
 * The shape of the QR generator form.
 * Used by Zustand store and Server Actions.
 */
export interface IQrFormState {
  type: QrType;
  content: string;
  label: string;
  foreground: string;
  background: string;
  size: number;
}

/**
 * Per-type breakdown entry used in dashboard charts.
 */
export interface IQrTypeBreakdown {
  type: QrType;
  count: number;
}

/**
 * Per-day entry for the "QRs generated over time" chart.
 */
export interface IQrOverTimeEntry {
  date: string; // "YYYY-MM-DD"
  count: number;
}

/**
 * Aggregated stats returned by getQrStats() for the dashboard.
 */
export interface IQrStats {
  totalQrs: number;
  totalScans: number;
  qrsByType: IQrTypeBreakdown[];
  qrOverTime: IQrOverTimeEntry[];
}

/**
 * Generic API response wrapper.
 * Either `data` or `error` will be present, never both.
 */
export type ApiResponse<T> =
  | { data: T; error?: never }
  | { error: string; data?: never };

/**
 * Paginated list response from getQrList().
 */
export interface IPaginatedQrList {
  data: IQrCode[];
  total: number;
  page: number;
  totalPages: number;
}
