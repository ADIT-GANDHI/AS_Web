import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">Page not found</h1>
      <p className="max-w-md text-neutral-600">The page you requested does not exist or has moved.</p>
      <Link href="/" className="text-neutral-900 underline underline-offset-4 hover:text-neutral-700">
        Back to home
      </Link>
    </div>
  );
}
