'use client';

import About from '@/components/About';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AboutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams?.get('tab') === 'kabir' ? 'kabir' : 'ajab';
  const menu = searchParams?.get('menu') || undefined;

  /* [Claude] these changes have been recommended by claude —
     Toggle moved inside <About> so it sits below the logo per Figma design.
     Text no longer says "ABOUT X" — it just says the target brand name. */
  const switchBrand = () => {
    router.push(`/about?tab=${tab === 'ajab' ? 'kabir' : 'ajab'}`);
  };

  const switchTarget = tab === 'ajab' ? 'Kabir Project' : 'Ajab Shahar';

  return (
    <About
      forcedTab={tab}
      forcedMenu={menu}
      onSwitchBrand={switchBrand}
      switchTarget={switchTarget}
    />
  );
}
