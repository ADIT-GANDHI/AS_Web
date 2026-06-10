'use client';

import { useEffect, useState } from 'react';
import { resolveCmsAssetUrl } from '@/lib/resolveCmsAssetUrl';

type HomeCardImageProps = {
  src?: string;
  fallbackSrc: string;
  alt: string;
};

/** CMS thumb with automatic fallback to local/mock art when missing or broken. */
export default function HomeCardImage({ src, fallbackSrc, alt }: HomeCardImageProps) {
  const fallback = resolveCmsAssetUrl(fallbackSrc);
  const [activeSrc, setActiveSrc] = useState(() => resolveCmsAssetUrl(src));

  useEffect(() => {
    setActiveSrc(resolveCmsAssetUrl(src));
  }, [src]);

  return (
    <img
      className="clh-media-img"
      src={activeSrc}
      alt={alt}
      decoding="async"
      onError={() => {
        if (activeSrc !== fallback) setActiveSrc(fallback);
      }}
    />
  );
}
