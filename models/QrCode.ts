import mongoose, { Document, Model, Schema } from "mongoose";

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

export interface IEditHistoryEntry {
  editedAt: Date;
  previousContent: string;
  previousLabel?: string;
  note?: string;
}

export interface IQrCodeDocument extends Document {
  // Core
  publicId: string;
  type: QrType;
  content: string;
  label?: string;
  scanCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Basic customization
  foreground: string;
  background: string;
  size: number;

  // Advanced customization
  dotStyle: DotStyle;
  cornerSquareStyle: CornerSquareStyle;
  cornerDotStyle: CornerDotStyle;
  cornerSquareColor: string;
  cornerDotColor: string;
  logo?: string;
  logoSize: number;
  logoBackgroundColor: string;
  margin: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  borderWidth: number;
  borderColor: string;
  borderPadding: number;

  // Edit tracking
  editHistory: IEditHistoryEntry[];
  lastEditedAt?: Date;

  // Reset / versioning
  isReset: boolean;
  resetAt?: Date;
}

const EditHistorySchema = new Schema<IEditHistoryEntry>(
  {
    editedAt: { type: Date, default: Date.now },
    previousContent: { type: String, required: true },
    previousLabel: { type: String },
    note: { type: String },
  },
  { _id: false },
);

const QrCodeSchema = new Schema<IQrCodeDocument>(
  {
    // ── Core ─────────────────────────────────────────────────────────────────
    publicId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ["URL", "TEXT", "EMAIL", "PHONE"] as QrType[],
      required: true,
    },
    content: { type: String, required: true },
    label: { type: String },
    scanCount: { type: Number, default: 0, index: true },

    // ── Basic customization ───────────────────────────────────────────────────
    foreground: { type: String, default: "#000000" },
    background: { type: String, default: "#FFFFFF" },
    size: { type: Number, default: 256 },

    // ── Advanced customization ────────────────────────────────────────────────
    dotStyle: {
      type: String,
      enum: [
        "square",
        "rounded",
        "dots",
        "classy",
        "classy-rounded",
        "extra-rounded",
      ],
      default: "square",
    },
    cornerSquareStyle: {
      type: String,
      enum: ["none", "dot", "square", "extra-rounded"],
      default: "square",
    },
    cornerDotStyle: {
      type: String,
      enum: ["none", "dot", "square"],
      default: "square",
    },
    cornerSquareColor: { type: String, default: "#000000" },
    cornerDotColor: { type: String, default: "#000000" },
    logo: { type: String },
    logoSize: { type: Number, default: 20 },
    logoBackgroundColor: { type: String, default: "#FFFFFF" },
    margin: { type: Number, default: 4 },
    errorCorrectionLevel: {
      type: String,
      enum: ["L", "M", "Q", "H"],
      default: "M",
    },
    borderWidth: { type: Number, default: 0 },
    borderColor: { type: String, default: "#000000" },
    borderPadding: { type: Number, default: 0 },

    // ── Edit tracking ─────────────────────────────────────────────────────────
    editHistory: { type: [EditHistorySchema], default: [] },
    lastEditedAt: { type: Date },

    // ── Reset / versioning ────────────────────────────────────────────────────
    isReset: { type: Boolean, default: false },
    resetAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "qrcodes",
  },
);

QrCodeSchema.index({ createdAt: -1 });

const QrCode: Model<IQrCodeDocument> =
  mongoose.models.QrCode ??
  mongoose.model<IQrCodeDocument>("QrCode", QrCodeSchema);

export default QrCode;
