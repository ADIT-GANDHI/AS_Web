import CLSongDetailsClient from './CLSongDetailsClient';

// One stub entry satisfies Next.js static-export requirement.
// All real song URLs are handled by the Apache SPA fallback (.htaccess)
// which serves index.html → Next.js client router → CLSongDetailsClient fetches from API.
export function generateStaticParams() {
  return [{ id: '0' }];
}

export default async function SongDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CLSongDetailsClient id={id} />;
}
