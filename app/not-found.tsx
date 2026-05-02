import Link from 'next/link';
import { QrCode, ArrowLeft } from 'lucide-react';

/**
 * Global 404 page — shown whenever Next.js cannot match a route
 * or when `notFound()` is called from a Server Component.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6 text-center">
      {/* Brand mark */}
      <div className="p-3 rounded-2xl bg-indigo-600 mb-6">
        <QrCode className="w-10 h-10 text-white" />
      </div>

      {/* 404 number */}
      <p className="text-8xl font-extrabold text-gray-200 dark:text-gray-700 leading-none select-none">
        404
      </p>

      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        Page not found
      </h1>

      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Double-check the URL or head back home.
      </p>

      <Link
        href="/generator"
        className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to QR Studio
      </Link>
    </div>
  );
}
