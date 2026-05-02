'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import QrCode from '@/models/QrCode';
import ScanEvent from '@/models/ScanEvent';
import type {
  IQrCode,
  IQrFormState,
  IQrStats,
  IPaginatedQrList,
  ApiResponse,
  IQrTypeBreakdown,
  IQrOverTimeEntry,
} from '@/types';

// ── Shared Zod schema ────────────────────────────────────────────────────────

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const qrSchema = z.object({
  type: z.enum(['URL', 'TEXT', 'EMAIL', 'PHONE'], {
    errorMap: () => ({ message: 'type must be one of: URL, TEXT, EMAIL, PHONE' }),
  }),
  content: z.string().min(1, 'Content must not be empty'),
  label: z.string().optional(),
  foreground: z
    .string()
    .regex(HEX_COLOR_RE, 'foreground must be a 6-digit hex color')
    .optional(),
  background: z
    .string()
    .regex(HEX_COLOR_RE, 'background must be a 6-digit hex color')
    .optional(),
  size: z
    .number()
    .int()
    .min(128, 'size must be at least 128')
    .max(512, 'size must be at most 512')
    .optional(),
});

// ── Helper: serialise a Mongoose lean document to IQrCode ───────────────────
// Mongoose lean() returns objects with ObjectId / Date instances.
// We must convert them to strings before crossing the Server→Client boundary.

function serialise(doc: Record<string, unknown>): IQrCode {
  return {
    _id: String(doc._id),
    publicId: doc.publicId as string,
    type: doc.type as IQrCode['type'],
    content: doc.content as string,
    label: doc.label as string | undefined,
    foreground: doc.foreground as string,
    background: doc.background as string,
    size: doc.size as number,
    scanCount: doc.scanCount as number,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}

// ── createQr ─────────────────────────────────────────────────────────────────

export async function createQr(
  formData: IQrFormState
): Promise<ApiResponse<IQrCode>> {
  const parsed = qrSchema.safeParse(formData);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { error: firstError?.message ?? 'Validation failed.' };
  }

  const { type, content, label, foreground, background, size } = parsed.data;

  try {
    await connectDB();

    const qr = await QrCode.create({
      publicId: nanoid(10),
      type,
      content,
      label,
      foreground: foreground ?? '#000000',
      background: background ?? '#FFFFFF',
      size: size ?? 256,
    });

    revalidatePath('/history');
    revalidatePath('/dashboard');

    return { data: serialise(qr.toObject()) };
  } catch (err: unknown) {
    console.error('[createQr]', err);
    return { error: 'Failed to save QR code. Please try again.' };
  }
}

// ── deleteQr ─────────────────────────────────────────────────────────────────

export async function deleteQr(
  id: string
): Promise<{ success: boolean } | { error: string }> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: 'Invalid QR code ID.' };
  }

  try {
    await connectDB();

    const objectId = new mongoose.Types.ObjectId(id);

    // Delete the QrCode document
    const deleted = await QrCode.findByIdAndDelete(objectId);
    if (!deleted) {
      return { error: 'QR code not found.' };
    }

    // Cascade-delete all associated scan events
    await ScanEvent.deleteMany({ qrId: objectId });

    revalidatePath('/history');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err: unknown) {
    console.error('[deleteQr]', err);
    return { error: 'Failed to delete QR code. Please try again.' };
  }
}

// ── getQrList ─────────────────────────────────────────────────────────────────

export async function getQrList(
  page: number,
  limit: number
): Promise<IPaginatedQrList> {
  // Clamp to safe values
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const skip = (safePage - 1) * safeLimit;

  await connectDB();

  const [docs, total] = await Promise.all([
    QrCode.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    QrCode.countDocuments(),
  ]);

  return {
    data: docs.map((d) => serialise(d as Record<string, unknown>)),
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

// ── getQrStats ────────────────────────────────────────────────────────────────

export async function getQrStats(): Promise<IQrStats> {
  await connectDB();

  // 30 days ago at midnight UTC
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const [
    totalQrs,
    totalScansAgg,
    qrsByTypeAgg,
    qrOverTimeAgg,
  ] = await Promise.all([
    // 1. Total QR codes
    QrCode.countDocuments(),

    // 2. Sum of all scanCounts across all documents
    QrCode.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$scanCount' } } },
    ]),

    // 3. Count per type
    QrCode.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),

    // 4. Count of QR codes created per day for the last 30 days
    // We group by the calendar date (UTC) of createdAt.
    QrCode.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalScans: number = totalScansAgg[0]?.total ?? 0;

  const qrsByType: IQrTypeBreakdown[] = qrsByTypeAgg.map((entry) => ({
    type: entry._id as IQrCode['type'],
    count: entry.count,
  }));

  const qrOverTime: IQrOverTimeEntry[] = qrOverTimeAgg.map((entry) => ({
    date: entry._id,
    count: entry.count,
  }));

  return { totalQrs, totalScans, qrsByType, qrOverTime };
}

// ── getTopQrs ─────────────────────────────────────────────────────────────────

export async function getTopQrs(limit: number): Promise<IQrCode[]> {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));

  await connectDB();

  const docs = await QrCode.find({})
    .sort({ scanCount: -1 })
    .limit(safeLimit)
    .lean();

  return docs.map((d) => serialise(d as Record<string, unknown>));
}
