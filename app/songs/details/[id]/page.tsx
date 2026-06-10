// import SongDetailsClient from './SongDetailsClient'; // original — kept untouched
import CLSongDetailsClient from './CLSongDetailsClient';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${AJAB_API_BASE}/Api/list?search=&page=1&limit=400&singer=&poet=`
    );
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

export default async function SongDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CLSongDetailsClient id={id} />;
}
