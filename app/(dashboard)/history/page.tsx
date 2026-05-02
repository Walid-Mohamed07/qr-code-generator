import type { Metadata } from 'next';
import { getQrList } from '@/lib/actions/qr';
import HistoryTable from '@/components/history/HistoryTable';
import Pagination from '@/components/history/Pagination';
import EditedBanner from '@/components/history/EditedBanner';

export const metadata: Metadata = {
  title: 'History',
  description: 'View and manage all your generated QR codes.',
};

const PAGE_SIZE = 10;

interface HistoryPageProps {
  searchParams: { page?: string; edited?: string };
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  // Parse and sanitise the page query param
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  const { data, total, totalPages } = await getQrList(page, PAGE_SIZE);

  return (
    <div>
      {/* Edited success banner */}
      {searchParams.edited === 'true' && <EditedBanner />}

      {/* Page header */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            History
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {total === 0
              ? 'No QR codes yet.'
              : `${total.toLocaleString()} QR code${total === 1 ? '' : 's'} total`}
          </p>
        </div>
      </div>

      {/* Table */}
      <HistoryTable items={data} />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
