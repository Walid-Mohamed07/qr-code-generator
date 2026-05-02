import { redirect } from 'next/navigation';

/**
 * Root route — redirect to the generator page as the default entry point.
 */
export default function RootPage() {
  redirect('/generator');
}
