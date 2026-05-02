/**
 * Creates all required MongoDB indexes for production performance.
 *
 * Run ONCE after initial deploy (or after wiping the DB):
 *   npx ts-node --project tsconfig.scripts.json scripts/createIndexes.ts
 *
 * Safe to re-run — MongoDB is idempotent on existing indexes.
 */

import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import mongoose from 'mongoose';

async function createIndexes(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set.');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(uri, { bufferCommands: false });
  console.log('✅  Connected.\n');

  const db = mongoose.connection.db;
  if (!db) throw new Error('No db connection');

  // ── QrCode collection indexes ───────────────────────────────────────────

  const qrCol = db.collection('qrcodes');

  await qrCol.createIndex(
    { publicId: 1 },
    { unique: true, name: 'publicId_unique' }
  );
  console.log('✅  qrcodes.publicId  — unique index');

  await qrCol.createIndex(
    { createdAt: -1 },
    { name: 'createdAt_desc' }
  );
  console.log('✅  qrcodes.createdAt — descending index');

  await qrCol.createIndex(
    { scanCount: -1 },
    { name: 'scanCount_desc' }
  );
  console.log('✅  qrcodes.scanCount — descending index');

  // Compound index for the "qrsByType" aggregation
  await qrCol.createIndex(
    { type: 1, createdAt: -1 },
    { name: 'type_createdAt' }
  );
  console.log('✅  qrcodes.(type, createdAt) — compound index');

  // ── ScanEvent collection indexes ────────────────────────────────────────

  const scanCol = db.collection('scanevents');

  await scanCol.createIndex(
    { qrId: 1 },
    { name: 'qrId_asc' }
  );
  console.log('✅  scanevents.qrId   — index');

  await scanCol.createIndex(
    { scannedAt: -1 },
    { name: 'scannedAt_desc' }
  );
  console.log('✅  scanevents.scannedAt — descending index');

  // Compound index for "events per QR sorted by time" queries
  await scanCol.createIndex(
    { qrId: 1, scannedAt: -1 },
    { name: 'qrId_scannedAt' }
  );
  console.log('✅  scanevents.(qrId, scannedAt) — compound index');

  console.log('\n🎉  All indexes created successfully.');
  await mongoose.disconnect();
  console.log('👋  Disconnected.');
}

createIndexes().catch((err) => {
  console.error('❌  createIndexes failed:', err);
  process.exit(1);
});
