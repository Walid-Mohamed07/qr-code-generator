/**
 * Seed script — populates the DB with 10 sample QR codes.
 *
 * Run with:
 *   npx ts-node --project tsconfig.scripts.json scripts/seed.ts
 *
 * Requires MONGODB_URI to be set in .env.local (dotenv is loaded below).
 */

import path from 'path';
import dotenv from 'dotenv';

// Load .env.local before importing any DB modules
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

// ── Inline minimal model definitions so ts-node doesn't need
//    the Next.js / bundler module resolution for @/ aliases ──

type QrType = 'URL' | 'TEXT' | 'EMAIL' | 'PHONE';

interface SeedQrCode {
  publicId: string;
  type: QrType;
  content: string;
  label?: string;
  foreground: string;
  background: string;
  size: number;
  scanCount: number;
}

const QrCodeSchema = new mongoose.Schema<SeedQrCode>(
  {
    publicId: { type: String, required: true, unique: true },
    type: { type: String, enum: ['URL', 'TEXT', 'EMAIL', 'PHONE'], required: true },
    content: { type: String, required: true },
    label: { type: String },
    foreground: { type: String, default: '#000000' },
    background: { type: String, default: '#FFFFFF' },
    size: { type: Number, default: 256 },
    scanCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'qrcodes' }
);

const QrCode =
  (mongoose.models.QrCode as mongoose.Model<SeedQrCode>) ??
  mongoose.model<SeedQrCode>('QrCode', QrCodeSchema);

const samples: Omit<SeedQrCode, 'publicId'>[] = [
  {
    type: 'URL',
    content: 'https://github.com',
    label: 'GitHub',
    foreground: '#24292e',
    background: '#ffffff',
    size: 256,
    scanCount: 142,
  },
  {
    type: 'URL',
    content: 'https://nextjs.org',
    label: 'Next.js Docs',
    foreground: '#000000',
    background: '#ffffff',
    size: 300,
    scanCount: 98,
  },
  {
    type: 'URL',
    content: 'https://tailwindcss.com',
    label: 'Tailwind CSS',
    foreground: '#06b6d4',
    background: '#ffffff',
    size: 256,
    scanCount: 55,
  },
  {
    type: 'URL',
    content: 'https://vercel.com',
    label: 'Vercel',
    foreground: '#000000',
    background: '#ffffff',
    size: 256,
    scanCount: 211,
  },
  {
    type: 'TEXT',
    content: 'Hello from the QR Generator! This is a text QR code.',
    label: 'Welcome message',
    foreground: '#1e293b',
    background: '#f8fafc',
    size: 256,
    scanCount: 30,
  },
  {
    type: 'TEXT',
    content: 'Wi-Fi: MyNetwork | Password: supersecret123',
    label: 'Wi-Fi credentials',
    foreground: '#7c3aed',
    background: '#ffffff',
    size: 320,
    scanCount: 77,
  },
  {
    type: 'EMAIL',
    content: 'hello@example.com',
    label: 'Support email',
    foreground: '#dc2626',
    background: '#ffffff',
    size: 256,
    scanCount: 19,
  },
  {
    type: 'EMAIL',
    content: 'sales@company.org',
    label: 'Sales team',
    foreground: '#000000',
    background: '#ffffff',
    size: 256,
    scanCount: 0,
  },
  {
    type: 'PHONE',
    content: '+14155552671',
    label: 'Customer support',
    foreground: '#16a34a',
    background: '#ffffff',
    size: 256,
    scanCount: 44,
  },
  {
    type: 'PHONE',
    content: '+442071234567',
    label: 'London office',
    foreground: '#000000',
    background: '#ffffff',
    size: 256,
    scanCount: 0,
  },
];

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set. Create a .env.local file first.');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(uri, { bufferCommands: false });
  console.log('✅  Connected.');

  // Clear existing seed data (safe for dev — won't touch prod unless you point it there)
  const deleted = await QrCode.deleteMany({});
  console.log(`🗑   Cleared ${deleted.deletedCount} existing QR code(s).`);

  const docs = samples.map((s) => ({ ...s, publicId: nanoid(10) }));
  const inserted = await QrCode.insertMany(docs);
  console.log(`🌱  Inserted ${inserted.length} sample QR codes.`);

  await mongoose.disconnect();
  console.log('👋  Done. Disconnected.');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
