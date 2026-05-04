"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import QrCode from "@/models/QrCode";
import ScanEvent from "@/models/ScanEvent";
import type {
  IQrCode,
  IQrFormState,
  IQrStats,
  IQrDetails,
  IPaginatedQrList,
  ApiResponse,
  IQrTypeBreakdown,
  IQrOverTimeEntry,
  IEditHistoryEntry,
  DeviceType,
} from "@/types";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

// -- Shared Zod schema --------------------------------------------------------

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const qrSchema = z.object({
  // Content fields
  type: z.enum(["URL", "TEXT", "EMAIL", "PHONE"], {
    errorMap: () => ({
      message: "type must be one of: URL, TEXT, EMAIL, PHONE",
    }),
  }),
  content: z.string().min(1, "Content must not be empty"),
  label: z.string().optional(),

  // Basic customization
  foreground: z
    .string()
    .regex(HEX_COLOR_RE, "foreground must be a 6-digit hex color")
    .optional(),
  background: z
    .string()
    .regex(HEX_COLOR_RE, "background must be a 6-digit hex color")
    .optional(),
  size: z.number().int().min(128).max(512).optional(),

  // Advanced customization
  dotStyle: z
    .enum([
      "square",
      "rounded",
      "dots",
      "classy",
      "classy-rounded",
      "extra-rounded",
    ])
    .optional(),
  cornerSquareStyle: z
    .enum(["none", "dot", "square", "extra-rounded"])
    .optional(),
  cornerDotStyle: z.enum(["none", "dot", "square"]).optional(),
  cornerSquareColor: z
    .string()
    .regex(HEX_COLOR_RE, "cornerSquareColor must be a 6-digit hex color")
    .optional(),
  cornerDotColor: z
    .string()
    .regex(HEX_COLOR_RE, "cornerDotColor must be a 6-digit hex color")
    .optional(),
  logo: z.string().optional(),
  logoSize: z.number().min(10).max(40).optional(),
  logoBackgroundColor: z
    .string()
    .regex(HEX_COLOR_RE, "logoBackgroundColor must be a 6-digit hex color")
    .optional(),
  margin: z.number().min(0).max(10).optional(),
  errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
  borderWidth: z.number().int().min(0).max(30).optional(),
  borderColor: z
    .string()
    .regex(HEX_COLOR_RE, "borderColor must be a 6-digit hex color")
    .optional(),
  borderPadding: z.number().int().min(0).max(40).optional(),
});

// Partial variant for updateQr
const qrSchemaPartial = qrSchema.partial();

// -- Helper: serialise edit history -------------------------------------------

function serialiseEditHistory(entries: unknown[]): IEditHistoryEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries.map((e) => {
    const entry = e as Record<string, unknown>;
    return {
      editedAt:
        entry.editedAt instanceof Date
          ? entry.editedAt.toISOString()
          : String(entry.editedAt ?? ""),
      previousContent: String(entry.previousContent ?? ""),
      previousLabel: entry.previousLabel as string | undefined,
      note: entry.note as string | undefined,
    };
  });
}

// -- Helper: serialise a Mongoose lean document to IQrCode -------------------

function serialise(doc: Record<string, unknown>): IQrCode {
  return {
    _id: String(doc._id),
    publicId: doc.publicId as string,
    type: doc.type as IQrCode["type"],
    content: doc.content as string,
    label: doc.label as string | undefined,
    scanCount: doc.scanCount as number,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),

    // Basic customization
    foreground: (doc.foreground as string) ?? "#000000",
    background: (doc.background as string) ?? "#FFFFFF",
    size: (doc.size as number) ?? 256,

    // Advanced customization
    dotStyle: (doc.dotStyle as IQrCode["dotStyle"]) ?? "square",
    cornerSquareStyle:
      (doc.cornerSquareStyle as IQrCode["cornerSquareStyle"]) ?? "square",
    cornerDotStyle:
      (doc.cornerDotStyle as IQrCode["cornerDotStyle"]) ?? "square",
    cornerSquareColor: (doc.cornerSquareColor as string) ?? "#000000",
    cornerDotColor: (doc.cornerDotColor as string) ?? "#000000",
    logo: doc.logo as string | undefined,
    logoSize: (doc.logoSize as number) ?? 20,
    logoBackgroundColor: (doc.logoBackgroundColor as string) ?? "#FFFFFF",
    margin: (doc.margin as number) ?? 4,
    errorCorrectionLevel:
      (doc.errorCorrectionLevel as IQrCode["errorCorrectionLevel"]) ?? "M",
    borderWidth: (doc.borderWidth as number) ?? 0,
    borderColor: (doc.borderColor as string) ?? "#000000",
    borderPadding: (doc.borderPadding as number) ?? 0,

    // Edit tracking
    editHistory: serialiseEditHistory((doc.editHistory as unknown[]) ?? []),
    lastEditedAt:
      doc.lastEditedAt instanceof Date
        ? doc.lastEditedAt.toISOString()
        : (doc.lastEditedAt as string | undefined),

    // Reset
    isReset: (doc.isReset as boolean) ?? false,
    resetAt:
      doc.resetAt instanceof Date
        ? doc.resetAt.toISOString()
        : (doc.resetAt as string | undefined),
  };
}

// -- createQr -----------------------------------------------------------------

export async function createQr(
  formData: IQrFormState,
): Promise<ApiResponse<IQrCode>> {
  const parsed = qrSchema.safeParse(formData);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { error: firstError?.message ?? "Validation failed." };
  }

  const {
    type,
    content,
    label,
    foreground,
    background,
    size,
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
    borderWidth,
    borderColor,
    borderPadding,
  } = parsed.data;

  // Force high error correction when a logo is embedded
  const ecl = logo ? "H" : (errorCorrectionLevel ?? "M");

  try {
    await connectDB();

    const qr = await QrCode.create({
      publicId: nanoid(),
      type,
      content,
      label,
      foreground: foreground ?? "#000000",
      background: background ?? "#FFFFFF",
      size: size ?? 256,
      dotStyle: dotStyle ?? "square",
      cornerSquareStyle: cornerSquareStyle ?? "square",
      cornerDotStyle: cornerDotStyle ?? "square",
      cornerSquareColor: cornerSquareColor ?? "#000000",
      cornerDotColor: cornerDotColor ?? "#000000",
      logo,
      logoSize: logoSize ?? 20,
      logoBackgroundColor: logoBackgroundColor ?? "#FFFFFF",
      margin: margin ?? 4,
      errorCorrectionLevel: ecl,
      borderWidth: borderWidth ?? 0,
      borderColor: borderColor ?? "#000000",
      borderPadding: borderPadding ?? 0,
    });

    revalidatePath("/history");
    revalidatePath("/dashboard");

    return {
      data: serialise(qr.toObject() as unknown as Record<string, unknown>),
    };
  } catch (err: unknown) {
    console.error("[createQr]", err);
    return { error: "Failed to save QR code. Please try again." };
  }
}

// -- updateQr -----------------------------------------------------------------

export async function updateQr(
  id: string,
  data: Partial<IQrFormState> & { editNote?: string },
): Promise<ApiResponse<IQrCode>> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: "Invalid QR code ID." };
  }

  const parsed = qrSchemaPartial.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { error: firstError?.message ?? "Validation failed." };
  }

  try {
    await connectDB();

    const objectId = new mongoose.Types.ObjectId(id);
    const existing = await QrCode.findById(objectId).lean();
    if (!existing) return { error: "QR code not found." };

    const rec = existing as unknown as Record<string, unknown>;

    // Force 'H' if a logo exists (incoming or already stored)
    const incomingLogo = parsed.data.logo ?? rec.logo;
    const ecl = incomingLogo
      ? "H"
      : (parsed.data.errorCorrectionLevel ?? rec.errorCorrectionLevel);

    const historyEntry = {
      editedAt: new Date(),
      previousContent: rec.content as string,
      previousLabel: rec.label as string | undefined,
      note: data.editNote,
    };

    const updated = await QrCode.findByIdAndUpdate(
      objectId,
      {
        $set: {
          ...parsed.data,
          ...(ecl ? { errorCorrectionLevel: ecl } : {}),
          lastEditedAt: new Date(),
        },
        $push: { editHistory: historyEntry },
      },
      { new: true },
    ).lean();

    if (!updated) return { error: "QR code not found." };

    revalidatePath("/history");
    revalidatePath("/dashboard");

    return {
      data: serialise(updated as unknown as Record<string, unknown>),
    };
  } catch (err: unknown) {
    console.error("[updateQr]", err);
    return { error: "Failed to update QR code. Please try again." };
  }
}

// -- deleteQr -----------------------------------------------------------------

export async function deleteQr(
  id: string,
): Promise<{ success: boolean } | { error: string }> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: "Invalid QR code ID." };
  }

  try {
    await connectDB();

    const objectId = new mongoose.Types.ObjectId(id);

    const deleted = await QrCode.findByIdAndDelete(objectId);
    if (!deleted) return { error: "QR code not found." };

    await ScanEvent.deleteMany({ qrId: objectId });

    revalidatePath("/history");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("[deleteQr]", err);
    return { error: "Failed to delete QR code. Please try again." };
  }
}

// -- resetQr ------------------------------------------------------------------

export async function resetQr(
  id: string,
): Promise<{ success: boolean } | { error: string }> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: "Invalid QR code ID." };
  }

  try {
    await connectDB();

    const objectId = new mongoose.Types.ObjectId(id);

    const updated = await QrCode.findByIdAndUpdate(
      objectId,
      {
        $set: {
          scanCount: 0,
          isReset: true,
          resetAt: new Date(),
          editHistory: [],
        },
      },
      { new: true },
    );

    if (!updated) return { error: "QR code not found." };

    await ScanEvent.deleteMany({ qrId: objectId });

    revalidatePath("/history");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("[resetQr]", err);
    return { error: "Failed to reset QR code. Please try again." };
  }
}

// -- getQrList ----------------------------------------------------------------

export async function getQrList(
  page: number,
  limit: number,
): Promise<IPaginatedQrList> {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const skip = (safePage - 1) * safeLimit;

  await connectDB();

  const [docs, total] = await Promise.all([
    QrCode.find({}).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    QrCode.countDocuments(),
  ]);

  return {
    data: docs.map((d) => serialise(d as Record<string, unknown>)),
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

// -- getQrDetails -------------------------------------------------------------

export async function getQrDetails(
  id: string,
): Promise<IQrDetails | { error: string }> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: "Invalid QR code ID." };
  }

  await connectDB();

  const objectId = new mongoose.Types.ObjectId(id);
  const qrDoc = await QrCode.findById(objectId).lean();
  if (!qrDoc) return { error: "Not found." };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const [scanTimelineAgg, deviceBreakdownAgg, recentScansAgg] =
    await Promise.all([
      // a. Daily scan counts for last 30 days
      ScanEvent.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            qrId: objectId,
            scannedAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$scannedAt",
                timezone: "UTC",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // b. Device type breakdown
      ScanEvent.aggregate<{ _id: string; count: number }>([
        { $match: { qrId: objectId } },
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // c. 10 most recent scans
      ScanEvent.find({ qrId: objectId })
        .sort({ scannedAt: -1 })
        .limit(10)
        .select("scannedAt deviceType referer ip")
        .lean(),
    ]);

  const rec = qrDoc as unknown as Record<string, unknown>;

  return {
    qr: serialise(rec),
    scanTimeline: scanTimelineAgg.map((e) => ({
      date: e._id,
      count: e.count,
    })),
    deviceBreakdown: deviceBreakdownAgg.map((e) => ({
      device: e._id ?? "unknown",
      count: e.count,
    })),
    recentScans: recentScansAgg.map((s) => {
      const scan = s as Record<string, unknown>;
      return {
        scannedAt:
          scan.scannedAt instanceof Date
            ? scan.scannedAt.toISOString()
            : String(scan.scannedAt),
        deviceType: (scan.deviceType as DeviceType) ?? "unknown",
        referer: scan.referer as string | undefined,
        ip: scan.ip as string | undefined,
      };
    }),
    editHistory: serialiseEditHistory((rec.editHistory as unknown[]) ?? []),
  };
}

// -- getQrStats ---------------------------------------------------------------

export async function getQrStats(): Promise<IQrStats> {
  await connectDB();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const [
    totalQrs,
    totalScansAgg,
    qrsByTypeAgg,
    qrOverTimeAgg,
    deviceBreakdownAgg,
    recentlyEditedDocs,
    editedCount,
    resetCount,
  ] = await Promise.all([
    QrCode.countDocuments(),

    QrCode.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$scanCount" } } },
    ]),

    QrCode.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),

    QrCode.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "UTC",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Device breakdown across all scan events
    ScanEvent.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$deviceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // 5 most recently edited QR codes
    QrCode.find({ lastEditedAt: { $exists: true, $ne: null } })
      .sort({ lastEditedAt: -1 })
      .limit(5)
      .lean(),

    // Count of QR codes that have been edited at least once
    QrCode.countDocuments({ "editHistory.0": { $exists: true } }),

    // Count of QR codes that have been reset at least once
    QrCode.countDocuments({ isReset: true }),
  ]);

  return {
    totalQrs,
    totalScans: totalScansAgg[0]?.total ?? 0,
    editedCount,
    resetCount,
    qrsByType: qrsByTypeAgg.map((e) => ({
      type: e._id as IQrCode["type"],
      count: e.count,
    })) as IQrTypeBreakdown[],
    qrOverTime: qrOverTimeAgg.map((e) => ({
      date: e._id,
      count: e.count,
    })) as IQrOverTimeEntry[],
    deviceBreakdown: deviceBreakdownAgg.map((e) => ({
      device: e._id ?? "unknown",
      count: e.count,
    })),
    recentlyEdited: recentlyEditedDocs.map((d) =>
      serialise(d as unknown as Record<string, unknown>),
    ),
  };
}

// -- getTopQrs ----------------------------------------------------------------

export async function getTopQrs(limit: number): Promise<IQrCode[]> {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));

  await connectDB();

  const docs = await QrCode.find({})
    .sort({ scanCount: -1 })
    .limit(safeLimit)
    .lean();

  return docs.map((d) => serialise(d as Record<string, unknown>));
}
