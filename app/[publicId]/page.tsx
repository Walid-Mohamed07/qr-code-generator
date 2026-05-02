import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Mail, Phone, FileText, ExternalLink } from 'lucide-react';
import { connectDB } from '@/lib/mongoose';
import QrCode from '@/models/QrCode';
import ScanEvent from '@/models/ScanEvent';

interface Props {
  params: { publicId: string };
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
