import CLPoemDetailClient from './CLPoemDetailClient';

export function generateStaticParams() {
  return [{ id: '0' }];
}

export default async function PoemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CLPoemDetailClient id={id} />;
}
