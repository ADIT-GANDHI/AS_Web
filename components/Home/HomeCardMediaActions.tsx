'use client';

import { resolveCmsAssetUrl } from '@/lib/resolveCmsAssetUrl';

type HomeCardMediaActionsProps = {
  soundCloudUrl?: string;
  downloadUrl?: string;
};

function normalizeExternalUrl(raw: string, cms = false): string {
  const value = raw.trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (cms) return resolveCmsAssetUrl(value);
  if (value.includes('soundcloud.com')) return value.startsWith('//') ? `https:${value}` : `https://${value}`;
  return `https://soundcloud.com/${value.replace(/^\/+/, '')}`;
}

function openExternalUrl(event: React.MouseEvent, url: string) {
  event.preventDefault();
  event.stopPropagation();
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function HomeCardMediaActions({
  soundCloudUrl,
  downloadUrl,
}: HomeCardMediaActionsProps) {
  const sc = soundCloudUrl?.trim();
  const dl = downloadUrl?.trim();
  if (!sc && !dl) return null;

  const scUrl = sc ? normalizeExternalUrl(sc) : '';
  const dlUrl = dl ? normalizeExternalUrl(dl, true) : '';

  return (
    <div className="clh-media-actions">
      {scUrl ? (
        <button
          type="button"
          className="clh-media-action clh-media-action--sc"
          aria-label="Play on SoundCloud"
          onClick={(event) => openExternalUrl(event, scUrl)}
        >
          SC
        </button>
      ) : null}
      {dlUrl ? (
        <button
          type="button"
          className="clh-media-action clh-media-action--dl"
          aria-label="Download"
          onClick={(event) => openExternalUrl(event, dlUrl)}
        >
          DL
        </button>
      ) : null}
    </div>
  );
}
