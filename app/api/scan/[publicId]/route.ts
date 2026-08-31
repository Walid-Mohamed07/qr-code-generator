import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import QrCode from '@/models/QrCode';
import ScanEvent, { parseDeviceType } from '@/models/ScanEvent';

// Scan requests modify data, so they must never be served from a route cache.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: { publicId: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { publicId } = params;

  try {
    await connectDB();

    // Atomically increment scanCount and return the updated document.
    // Using findOneAndUpdate with { new: true } so we work with the
    // post-increment version in one round-trip.
    const qr = await QrCode.findOneAndUpdate(
      { publicId },
      { $inc: { scanCount: 1 } },
      { new: true }
    ).lean();

    if (!qr) {
      return NextResponse.json(
        { error: `QR code with id "${publicId}" not found.` },
        { status: 404 }
      );
    }

    // Fire-and-forget scan event — we don't want a failed event write
    // to block the user's redirect. The void intentionally suppresses
    // the floating promise; errors are caught internally.
    void ScanEvent.create({
      qrId: qr._id,
      scannedAt: new Date(),
      userAgent: request.headers.get('user-agent') ?? undefined,
      referer: request.headers.get('referer') ?? undefined,
      ip:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        undefined,
      deviceType: parseDeviceType(request.headers.get('user-agent') ?? undefined),
    }).catch((err: unknown) => {
      console.error('[scan] Failed to write ScanEvent:', err);
    });

    // For URL type: 302 redirect to the target URL.
    // For all other types: return the content as JSON so clients can
    // display it (e.g. copy a phone number, show a text message).
    if (qr.type === 'URL') {
      const response = NextResponse.redirect(qr.content, { status: 302 });
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    }

    const response = NextResponse.json(
      {
        data: {
          type: qr.type,
          content: qr.content,
          label: qr.label ?? null,
        },
      },
      { status: 200 }
    );
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (err: unknown) {
    console.error('[GET /api/scan/:publicId]', err);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
