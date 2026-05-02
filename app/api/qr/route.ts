import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { connectDB } from '@/lib/mongoose';
import QrCode from '@/models/QrCode';

// ── Zod validation schema ────────────────────────────────────────────────────

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const createQrSchema = z.object({
  type: z.enum(['URL', 'TEXT', 'EMAIL', 'PHONE'], {
    errorMap: () => ({
      message: 'type must be one of: URL, TEXT, EMAIL, PHONE',
    }),
  }),
  content: z
    .string({ required_error: 'content is required' })
    .min(1, 'content must not be empty'),
  label: z.string().optional(),
  foreground: z
    .string()
    .regex(HEX_COLOR_RE, 'foreground must be a 6-digit hex color (e.g. #000000)')
    .optional(),
  background: z
    .string()
    .regex(HEX_COLOR_RE, 'background must be a 6-digit hex color (e.g. #FFFFFF)')
    .optional(),
  size: z
    .number()
    .int()
    .min(128, 'size must be at least 128')
    .max(512, 'size must be at most 512')
    .optional(),
});

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const parsed = createQrSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed.',
        // Flatten Zod errors into an array of { field, message } objects
        // so API consumers get actionable, field-level feedback.
        details: parsed.error.errors.map((e) => ({
          field: e.path.join('.') || 'root',
          message: e.message,
        })),
      },
      { status: 400 }
    );
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

    return NextResponse.json({ data: qr.toObject() }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/qr]', err);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
