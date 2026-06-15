'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function HeaderAboutDropdown() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAboutPage = pathname?.startsWith('/about');
  const aboutTabKabir = isAboutPage && searchParams?.get('tab') === 'kabir';

  return (
    <div className="about-nav-dropdown-wrap hidden md:flex md:items-center">
      <Link
        href="/about?tab=ajab"
        className={`nav-link nav-link--about ${isAboutPage ? 'active' : ''}`}
      >
        ABOUT
      </Link>
      <div className="about-nav-dropdown" role="menu" aria-label="About sections">
        <div className="about-nav-dropdown-panel">
          <Link
            href="/about?tab=ajab"
            role="menuitem"
            className={`about-nav-dropdown-link${
              isAboutPage && !aboutTabKabir ? ' about-nav-dropdown-link--active' : ''
            }`}
          >
            AJAB SHAHAR
          </Link>
          <Link
            href="/about?tab=kabir"
            role="menuitem"
            className={`about-nav-dropdown-link${
              isAboutPage && aboutTabKabir ? ' about-nav-dropdown-link--active' : ''
            }`}
          >
            KABIR PROJECT
          </Link>
        </div>
      </div>
    </div>
  );
}
