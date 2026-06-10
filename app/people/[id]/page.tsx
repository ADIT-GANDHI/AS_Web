// import PeopleDetailsClient from './PeopleDetailsClient'; // original — kept untouched
import CLPeopleDetail from '@/components/People/CLPeopleDetail';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

export const dynamicParams = false;

export async function generateStaticParams() {
  const mockClIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
  const fallbackIds = Array.from({ length: 500 }, (_, index) => String(index + 1));

  try {
    const response = await fetch(`${AJAB_API_BASE}/Api/person_list`);

    if (!response.ok) {
      return [...mockClIds, ...fallbackIds].map((id) => ({ id }));
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data?.people)
      ? payload.data.people
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.people)
          ? payload.people
          : [];

    const apiIds = items
      .map((item: any) => String(item?.id || item?.person_id || '').trim())
      .filter(Boolean);

    const uniqueIds = Array.from(new Set([...mockClIds, ...apiIds, ...fallbackIds]));
    return uniqueIds.map((id) => ({ id }));
  } catch {
    return [...mockClIds, ...fallbackIds].map((id) => ({ id }));
  }
}

export default async function PeopleDetailsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <CLPeopleDetail id={id} />;
}
