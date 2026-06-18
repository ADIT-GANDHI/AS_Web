import CLPeopleDetail from '@/components/People/CLPeopleDetail';

export function generateStaticParams() {
  return [{ id: '0' }];
}

export default async function PeopleDetailsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CLPeopleDetail id={id} />;
}
