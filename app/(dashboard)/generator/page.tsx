import type { Metadata } from 'next';
import QrGeneratorClient from '@/components/generator/QrGeneratorClient';

export const metadata: Metadata = {
  title: 'QR Generator',
  description: 'Generate and customise QR codes for URLs, text, emails, and phone numbers.',
};

// This is a pure Server Component — it has no data to fetch,
// so it just provides the page heading and renders the interactive
// client subtree (QrGeneratorClient) which owns all state.
export default function GeneratorPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          QR Generator
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create QR codes for URLs, text, email addresses, and phone numbers.
        </p>
      </div>
      <QrGeneratorClient />
    </div>
  );
}
