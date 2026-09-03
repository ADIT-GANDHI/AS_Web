// [Claude] these changes have been recommended by claude — dev/QA index of
// the /home-preview/[bg] routes, listing every registered background.
// TO REVERT: delete the app/home-preview/ directory.
import Link from 'next/link';
import { HOME_BACKGROUND_IDS } from '@/lib/homeBackgrounds';

export default function HomeBackgroundPreviewIndex() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Home background previews</h1>
      <ul>
        {HOME_BACKGROUND_IDS.map((id) => (
          <li key={id}>
            <Link href={`/home-preview/${id}`}>{id}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
