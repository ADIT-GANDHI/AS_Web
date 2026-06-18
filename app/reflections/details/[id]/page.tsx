import CLReflectionDetail from '@/components/Reflections/CLReflectionDetail';

export function generateStaticParams() {
  return [{ id: '0' }];
}

export default async function ReflectionDetailsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CLReflectionDetail id={id} />;
}
