import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

/**
 * Parse a User-Agent string into a broad device category.
 * Order matters: check tablet before mobile (some tablet UAs contain both).
 */
export function parseDeviceType(userAgent?: string): DeviceType {
  if (!userAgent) return 'unknown';
  if (/tablet/i.test(userAgent)) return 'tablet';
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/windows|macintosh|linux/i.test(userAgent)) return 'desktop';
  return 'unknown';
}

export interface IScanEventDocument extends Document {
  qrId: Types.ObjectId;
  scannedAt: Date;
  userAgent?: string;
  referer?: string;
  deviceType: DeviceType;
  city?: string;
  country?: string;
}

const ScanEventSchema = new Schema<IScanEventDocument>(
  {
    qrId: {
      type: Schema.Types.ObjectId,
      ref: 'QrCode',
      required: true,
      index: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userAgent: { type: String },
    referer: { type: String },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
      default: 'unknown',
    },
    city: { type: String },
    country: { type: String },
  },
  {
    timestamps: false,
    collection: 'scanevents',
  }
);

// Compound index for per-QR timeline queries
ScanEventSchema.index({ qrId: 1, scannedAt: -1 });

const ScanEvent: Model<IScanEventDocument> =
  mongoose.models.ScanEvent ??
  mongoose.model<IScanEventDocument>('ScanEvent', ScanEventSchema);

export default ScanEvent;
