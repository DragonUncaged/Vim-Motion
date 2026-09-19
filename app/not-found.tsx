import type { Metadata } from 'next';
import { NotFound } from '@/components/NotFound';

export const metadata: Metadata = {
  title: 'Not found',
  description: 'That page does not exist — the link is wrong or the page has moved.',
};

export default function Page() {
  return <NotFound />;
}
