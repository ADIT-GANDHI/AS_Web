import type { ReactNode } from 'react';
import { withAppBasePath } from '@/lib/resolveCmsAssetUrl';

const HOME_TILE_SHEET = withAppBasePath('/home-assets/home_tile_with_both_waves.png');

type HomeCardShellProps = {
  className: string;
  media?: ReactNode;
  children: ReactNode;
  /** When provided the whole card renders as an <a> — no nested anchors needed inside. */
  href?: string;
};

/**
 * Media cards: one 2px-padded surface → media slot → wavy sheet (no extra nested boxes).
 * Pass `href` to make the entire card a clickable link; omit for non-linked cards.
 */
export default function HomeCardShell({ className, media, children, href }: HomeCardShellProps) {
  const withMedia = Boolean(media);

  const inner = (
    <div className={`clh-card-stack${withMedia ? ' clh-card-stack--with-media' : ''}`}>
      {withMedia ? (
        <div className="clh-card-surface">
          <div className="clh-media-slot">{media}</div>
          <div className="clh-card-sheet">
            <img
              className="clh-card-sheet-shape"
              src={HOME_TILE_SHEET}
              alt=""
              width={503}
              height={485}
              decoding="async"
            />
            <div className="clh-card-body">{children}</div>
          </div>
        </div>
      ) : (
        <div className="clh-card-sheet">
          <img
            className="clh-card-sheet-shape"
            src={HOME_TILE_SHEET}
            alt=""
            width={503}
            height={485}
            decoding="async"
          />
          <div className="clh-card-body">{children}</div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a className={`clh-card ${className}`.trim()} href={href}>
        {inner}
      </a>
    );
  }

  return (
    <div className={`clh-card ${className}`.trim()}>
      {inner}
    </div>
  );
}
