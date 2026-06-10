// import FilmDetailsClient from './FilmDetailsClient'; // original — kept untouched
import CLFilmDetail from '@/components/Films/CLFilmDetail';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

export const dynamicParams = false;

const MOCK_ROUTE_IDS = ['f1', 'f2', 'f3', 'f4', 'f5'];

export async function generateStaticParams() {
  const fallbackIds = Array.from({ length: 500 }, (_, index) => String(index + 1));

  try {
    const response = await fetch(`${AJAB_API_BASE}/Api/film_list`);

    if (!response.ok) {
      return Array.from(new Set([...fallbackIds, ...MOCK_ROUTE_IDS])).map((id) => ({ id }));
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.films)
        ? payload.films
        : [];

    const apiIds = items
      .map((item: any) => String(item?.id || item?.film_id || '').trim())
      .filter(Boolean);

    const uniqueIds = Array.from(new Set([...apiIds, ...fallbackIds, ...MOCK_ROUTE_IDS]));
    return uniqueIds.map((id) => ({ id }));
  } catch {
    return Array.from(new Set([...fallbackIds, ...MOCK_ROUTE_IDS])).map((id) => ({ id }));
  }
}

export default async function FilmDetailsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <CLFilmDetail id={id} />;
}
