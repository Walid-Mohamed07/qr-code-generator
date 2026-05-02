import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IScanEventDocument extends Document {
  qrId: Types.ObjectId;
  scannedAt: Date;
  userAgent?: string;
  referer?: string;
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
    userAgent: {
      type: String,
    },
    referer: {
      type: String,
    },
  },
  {
    // No timestamps — scannedAt IS the timestamp; avoids redundant updatedAt
    timestamps: false,
    collection: 'scanevents',
  }
);

const ScanEvent: Model<IScanEventDocument> =
  mongoose.models.ScanEvent ??
  mongoose.model<IScanEventDocument>('ScanEvent', ScanEventSchema);

export default ScanEvent;
