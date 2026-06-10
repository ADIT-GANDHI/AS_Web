// import ReflectionDetailsClient from './ReflectionDetailsClient'; // original — kept untouched
import CLReflectionDetail from '@/components/Reflections/CLReflectionDetail';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

export const dynamicParams = false;

export async function generateStaticParams() {
  const fallbackIds = Array.from({ length: 500 }, (_, index) => String(index + 1));

  try {
    const response = await fetch(`${AJAB_API_BASE}/Api/reflection_list`);

    if (!response.ok) {
      return fallbackIds.map((id) => ({ id }));
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data?.reflections)
      ? payload.data.reflections
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.reflections)
          ? payload.reflections
          : [];

    const apiIds = items
      .map((item: any) => String(item?.id || item?.reflection_id || '').trim())
      .filter(Boolean);

    const uniqueIds = Array.from(new Set([...apiIds, ...fallbackIds]));
    return uniqueIds.map((id) => ({ id }));
  } catch {
    return fallbackIds.map((id) => ({ id }));
  }
}

export default async function ReflectionDetailsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <CLReflectionDetail id={id} />;
}
