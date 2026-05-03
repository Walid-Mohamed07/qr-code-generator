import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { connectDB } from '@/lib/mongoose';
import QrCodeModel from '@/models/QrCode';
import type { QrType } from '@/types';

export const runtime = 'nodejs';

// Cache OG images at the CDN layer for 1 hour, re-validate in background
export const revalidate = 3600;

function typeLabel(type: QrType): string {
  switch (type) {
    case 'URL':   return 'Website Link';
    case 'EMAIL': return 'Email Address';
    case 'PHONE': return 'Phone Number';
    case 'TEXT':  return 'Text Message';
  }
}

function shortContent(type: QrType, content: string): string {
  const MAX = 55;
  const text =
    type === 'URL'
      ? content.replace(/^https?:\/\//, '')
      : content;
  return text.length > MAX ? text.slice(0, MAX) + '…' : text;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  await connectDB();

  const qr = await QrCodeModel.findOne({ publicId: params.publicId })
    .select('type content label foreground background')
    .lean();

  if (!qr) {
    return new Response('Not found', { status: 404 });
  }

  // Generate QR PNG as a data-URL on the server (qrcode is Node-only)
  const qrDataUrl = await QRCode.toDataURL(qr.content, {
    width: 220,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark:  qr.foreground ?? '#000000',
      light: qr.background ?? '#ffffff',
    },
  });

  const title    = qr.label ? qr.label : typeLabel(qr.type);
  const subtitle = shortContent(qr.type, qr.content);
  const badge    = typeLabel(qr.type).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          padding: '56px 64px',
          alignItems: 'center',
          gap: '56px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* QR Code card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '16px',
            flexShrink: 0,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={220} height={220} alt="QR Code" />
        </div>

        {/* Text block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* App name */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            QR Studio
          </div>

          {/* QR title */}
          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              wordBreak: 'break-word',
            }}
          >
            {title}
          </div>

          {/* Content preview */}
          <div
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.82)',
              wordBreak: 'break-all',
            }}
          >
            {subtitle}
          </div>

          {/* Type badge */}
          <div
            style={{
              display: 'flex',
              marginTop: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 14,
                fontWeight: 600,
                color: '#4f46e5',
                background: '#ffffff',
                borderRadius: '999px',
                padding: '6px 16px',
                letterSpacing: '0.06em',
              }}
            >
              {badge}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
