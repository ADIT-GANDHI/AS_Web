import CLFilmDetail from '@/components/Films/CLFilmDetail';

export function generateStaticParams() {
  return [{ id: '0' }];
}

export default async function FilmDetailsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CLFilmDetail id={id} />;
}
