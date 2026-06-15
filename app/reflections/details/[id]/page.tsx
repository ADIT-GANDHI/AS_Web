// import ReflectionDetailsClient from './ReflectionDetailsClient'; // original — kept untouched
import CLReflectionDetail from '@/components/Reflections/CLReflectionDetail';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${AJAB_API_BASE}/Api/reflection_list?page=1&limit=500`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      return [{ id: '1' }];
    }

    const payload = await res.json();
    const items = Array.isArray(payload?.data?.reflections)
      ? payload.data.reflections
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.reflections)
          ? payload.reflections
          : [];

    const ids = items
      .map((item: { id?: unknown; reflection_id?: unknown }) =>
        String(item?.id || item?.reflection_id || '').trim()
      )
      .filter(Boolean);

    return ids.length ? ids.map((id) => ({ id })) : [{ id: '1' }];
  } catch {
    return [{ id: '1' }];
  }
}

export default async function ReflectionDetailsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <CLReflectionDetail id={id} />;
}
