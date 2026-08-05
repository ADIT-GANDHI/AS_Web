import { redirect } from 'next/navigation';

export function generateStaticParams() {
  return [{ id: '0' }];
}

/** Legacy `/poems/[id]` → single Poems page with `?id=`. */
export default async function PoemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/poems?id=${encodeURIComponent(id)}`);
}
