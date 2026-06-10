import CLPoemDetailClient from './CLPoemDetailClient';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

export async function generateStaticParams() {
  try {
    const res = await fetch(`${AJAB_API_BASE}/Api/poems?page=1&limit=400`, {
      cache: 'no-store',
    });
    if (!res.ok) return Array.from({ length: 300 }, (_, i) => ({ id: String(i + 1) }));
    const payload = await res.json();
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const ids = items
      .map((item: any) => String(item?.id || '').trim())
      .filter(Boolean);
    return ids.length
      ? ids.map((id: string) => ({ id }))
      : Array.from({ length: 300 }, (_, i) => ({ id: String(i + 1) }));
  } catch {
    return Array.from({ length: 300 }, (_, i) => ({ id: String(i + 1) }));
  }
}

export default async function PoemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CLPoemDetailClient id={id} />;
}
