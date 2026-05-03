import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { Mail, Phone, FileText, ExternalLink } from 'lucide-react';
import { connectDB } from '@/lib/mongoose';
import QrCode from '@/models/QrCode';
import ScanEvent, { parseDeviceType } from '@/models/ScanEvent';
import type { QrType } from '@/types';

interface Props {
  params: { publicId: string };
}

// ── Dynamic metadata for social sharing ──────────────────────────────────────

function buildDescription(type: QrType, content: string): string {
  switch (type) {
    case 'URL':   return `Scan this QR code to visit: ${content}`;
    case 'EMAIL': return `Scan this QR code to send an email to ${content}`;
    case 'PHONE': return `Scan this QR code to call ${content}`;
    case 'TEXT':  return 'Scan this QR code to read the message';
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connectDB();

  const qr = await QrCode.findOne({ publicId: params.publicId })
    .select('type content label')
    .lean();

  if (!qr) return { title: 'QR Code Not Found | QR Studio' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://myqrcode-opal.vercel.app';
  const ogImageUrl = `${appUrl}/api/og/${params.publicId}`;
  const pageUrl    = `${appUrl}/${params.publicId}`;

  const title =
    qr.label
      ? `${qr.label} — QR Studio`
      : `${qr.type} QR Code — QR Studio`;

  const description = buildDescription(qr.type, qr.content);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'QR Studio',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ScanPage({ params }: Props) {
  await connectDB();

  const headersList = headers();

  const qr = await QrCode.findOneAndUpdate(
    { publicId: params.publicId },
    { $inc: { scanCount: 1 } },
    { new: true }
  ).lean();

  if (!qr) notFound();

  void ScanEvent.create({
    qrId: qr._id,
    scannedAt: new Date(),
    userAgent: headersList.get('user-agent') ?? undefined,
    referer: headersList.get('referer') ?? undefined,
    deviceType: parseDeviceType(headersList.get('user-agent') ?? undefined),
  }).catch((err: unknown) => console.error('[scan]', err));

  // URL type: transparent one-step redirect straight to the destination
  if (qr.type === 'URL') {
    redirect(qr.content);
  }

  // TEXT / EMAIL / PHONE: show content on a clean page
  const actionHref =
    qr.type === 'EMAIL'
      ? `mailto:${qr.content}`
      : qr.type === 'PHONE'
      ? `tel:${qr.content}`
      : null;

  const Icon =
    qr.type === 'EMAIL' ? Mail : qr.type === 'PHONE' ? Phone : FileText;

  const actionLabel =
    qr.type === 'EMAIL'
      ? 'Send Email'
      : qr.type === 'PHONE'
      ? 'Call Now'
      : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
          <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>

        {qr.label && (
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {qr.label}
          </p>
        )}

        <p className="text-xl font-semibold text-gray-900 dark:text-white break-all">
          {qr.content}
        </p>

        {actionHref && actionLabel && (
          <a
            href={actionHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {actionLabel}
          </a>
        )}
      </div>
    </div>
  );
}
