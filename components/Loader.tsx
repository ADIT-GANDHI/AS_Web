'use client';

import './Loader.css';
import logo from '../public/logo.svg';

export type LoaderVariant = 'fullscreen' | 'panel';

/** `panel` = cover only the positioned parent (e.g. `<main>`), so header/footer stay visible. */
export default function Loader({ variant = 'fullscreen' }: { variant?: LoaderVariant }) {
  const cls = variant === 'panel' ? 'loader-overlay loader-overlay--panel' : 'loader-overlay';
  return (
    <div className={cls}>
      <div className="loader-logo-wrap">
        <img
          src={logo.src}
          alt="Ajab Shahar"
          className="loader-logo"
          fetchPriority="high"
          decoding="async"
        />
      </div>
    </div>
  );
}
