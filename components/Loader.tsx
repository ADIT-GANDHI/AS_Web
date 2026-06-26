'use client';

import './Loader.css';
import { LOADER_SPINNER } from '@/lib/resolveCmsAssetUrl';

export type LoaderVariant = 'fullscreen' | 'panel';

/** Default `fullscreen` = opaque white viewport + spinner GIF. `panel` = inline overlay. */
export default function Loader({ variant = 'fullscreen' }: { variant?: LoaderVariant }) {
  const cls = variant === 'panel' ? 'loader-overlay loader-overlay--panel' : 'loader-overlay';
  return (
    <div className={cls} role="status" aria-live="polite" aria-label="Loading">
      <div className="loader-spinner-wrap">
        <img
          src={LOADER_SPINNER}
          alt=""
          className="loader-spinner"
          fetchPriority="high"
          decoding="async"
          aria-hidden
        />
      </div>
    </div>
  );
}
