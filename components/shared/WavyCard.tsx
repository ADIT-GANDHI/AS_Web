'use client';

import type { CSSProperties, ReactNode } from 'react';
import './WavyCard.css';

// ──────────────────────────────────────────────────────────────────────
// WavyCard — single primitive for every wavy paper card across the app
// (Songs listing, Reflections listing, Songs detail version slider, and
// any future module that needs the same look).
//
// What it owns:
//   • The wavy paper-card shape: top seam (::before on body) + bottom
//     drop-shadow (::after on card) using the Figma-exported PNGs.
//   • Card layout (column flex, drop shadow, hover lift, top radius,
//     overflow visible so the wavy ornaments hang outside).
//   • Thumbnail wrapper (with optional inset for listing cards).
//
// What the consumer owns:
//   • Title / subtitle / meta typography (per-module CSS class on children).
//   • Click behaviour (passed via `href` or `onClick`).
//
// `as` defaults to "div"; pass "a" + href for the listing cards so the
// whole card becomes a link (Songs listing, version slider).
// ──────────────────────────────────────────────────────────────────────

type CardElement = 'div' | 'a';

export interface WavyCardProps {
  as?: CardElement;
  href?: string;
  onClick?: () => void;

  /** Image src; overrides `thumb` if both provided. */
  imageSrc?: string;
  imageAlt?: string;
  /** Custom thumbnail content (e.g. play overlay, video, etc.). */
  thumb?: ReactNode;
  /** Inset the thumbnail by `--ajab-card-thumb-pad` (default 2px) — listing cards. */
  insetThumb?: boolean;

  /** Card body content (title / subtitle / meta etc.). */
  children: ReactNode;

  className?: string;
  bodyClassName?: string;
  thumbClassName?: string;
  style?: CSSProperties;
}

export default function WavyCard({
  as = 'div',
  href,
  onClick,
  imageSrc,
  imageAlt = '',
  thumb,
  insetThumb = false,
  children,
  className = '',
  bodyClassName = '',
  thumbClassName = '',
  style,
}: WavyCardProps) {
  const Tag: any = as;
  const isClickable = Boolean(onClick || (as === 'a' && href));
  const cardClass = `wc-card ${isClickable ? 'is-clickable' : ''} ${className}`.trim();
  const thumbClass = `wc-thumb ${insetThumb ? 'wc-thumb--inset' : ''} ${thumbClassName}`.trim();

  const tagProps: Record<string, unknown> = {};
  if (as === 'a' && href) tagProps.href = href;
  if (onClick) tagProps.onClick = onClick;

  return (
    <Tag className={cardClass} style={style} {...tagProps}>
      <div className={thumbClass}>
        {thumb ?? (imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            onError={(e) => {
              const t = e.currentTarget;
              t.onerror = null; // prevent infinite loop
              t.src = '/placeholder.svg';
            }}
          />
        ) : (
          <img
            src="/placeholder.svg"
            alt={imageAlt}
            style={{ objectFit: 'contain', background: '#f0ece5' }}
          />
        ))}
      </div>
      <div className={`wc-body ${bodyClassName}`}>{children}</div>
    </Tag>
  );
}
