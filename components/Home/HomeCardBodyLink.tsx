import Link from 'next/link';
import type { ReactNode } from 'react';
import { withAppBasePath } from '@/lib/resolveCmsAssetUrl';

type HomeCardBodyLinkProps = {
  detailHref: string;
  active: boolean;
  children: ReactNode;
};

/** When a home card shows inline video, only the text block links to the detail page. */
export default function HomeCardBodyLink({ detailHref, active, children }: HomeCardBodyLinkProps) {
  if (!active) return <>{children}</>;
  return (
    <Link href={withAppBasePath(detailHref)} className="clh-card-body-link">
      {children}
    </Link>
  );
}
