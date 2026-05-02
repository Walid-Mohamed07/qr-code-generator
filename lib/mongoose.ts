import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Missing MONGODB_URI environment variable. ' +
      'Please add it to your .env.local file. ' +
      'See .env.example for the expected format.'
  );
}

/**
 * Cached connection stored on the global object so it survives
 * Next.js hot-module replacement in development without opening
 * multiple connections per reload.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type to hold our cache
declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongooseCache ?? {
  conn: null,
  promise: null,
};

// Persist on global so subsequent hot-reloads reuse the same object
global.__mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      // Recommended for serverless / edge environments:
      // bufferCommands=false ensures errors surface immediately
      // instead of buffering indefinitely when the DB is unreachable.
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset the promise so the next call retries
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
