import { cn } from '@/lib/utils';
import type { QrType } from '@/types';

interface BadgeProps {
  type: QrType;
  className?: string;
}

const TYPE_STYLES: Record<QrType, string> = {
  URL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  TEXT: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  EMAIL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  PHONE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
};

export default function Badge({ type, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TYPE_STYLES[type],
        className
      )}
    >
      {type}
    </span>
  );
}
