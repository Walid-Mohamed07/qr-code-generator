import mongoose, { Document, Model, Schema } from 'mongoose';

export type QrType = 'URL' | 'TEXT' | 'EMAIL' | 'PHONE';

export interface IQrCodeDocument extends Document {
  publicId: string;
  type: QrType;
  content: string;
  label?: string;
  foreground: string;
  background: string;
  size: number;
  scanCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const QrCodeSchema = new Schema<IQrCodeDocument>(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['URL', 'TEXT', 'EMAIL', 'PHONE'] as QrType[],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    label: {
      type: String,
    },
    foreground: {
      type: String,
      default: '#000000',
    },
    background: {
      type: String,
      default: '#FFFFFF',
    },
    size: {
      type: Number,
      default: 256,
    },
    scanCount: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'qrcodes',
  }
);

// Compound index for dashboard queries (sorted by newest first)
QrCodeSchema.index({ createdAt: -1 });

const QrCode: Model<IQrCodeDocument> =
  mongoose.models.QrCode ??
  mongoose.model<IQrCodeDocument>('QrCode', QrCodeSchema);

export default QrCode;
