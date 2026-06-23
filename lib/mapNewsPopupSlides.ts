import type { NewsPopupSlide } from '@/components/CLContentSliderModal';
import {
  getPopupItemsForNewsRow,
  isCmsPublished,
  isNewsRowPublished,
  isRenderableNewsPopupCategory,
  type NewsRow,
} from '@/lib/cmsNews';
import { extractYouTubeId } from '@/lib/youtube';
import { CMS_IMAGE_PLACEHOLDER, resolveCmsAssetUrl } from '@/lib/resolveCmsAssetUrl';

function popupToSlide(
  newsItem: NewsRow,
  popup: ReturnType<typeof getPopupItemsForNewsRow>[number],
  index: number,
  toImageUrl: (value?: string) => string
): NewsPopupSlide | null {
  const category = String(popup.category || '').toLowerCase();
  if (!isRenderableNewsPopupCategory(category)) return null;
  if (!isCmsPublished(popup.published)) return null;

  if (category === 'video') {
    const videoId = extractYouTubeId(popup.video_url);
    return {
      slideId: `${newsItem.id ?? 'n'}-${index}`,
      newsId: String(newsItem.id ?? ''),
      category: 'video',
      title: popup.title || '',
      secondTitle: popup.second_title || '',
      content: popup.content || '',
      images: videoId ? [] : [CMS_IMAGE_PLACEHOLDER],
      videoId: videoId || undefined,
      sequenceOrder: Number(popup.sequence_order) || 99,
    };
  }

  const images =
    category === 'single'
      ? [toImageUrl(popup.image)].filter(Boolean)
      : Array.isArray(popup.images)
        ? popup.images.map((entry) => toImageUrl(entry)).filter(Boolean)
        : [];
  const resolved = images.map((url) => resolveCmsAssetUrl(url));

  return {
    slideId: `${newsItem.id ?? 'n'}-${index}`,
    newsId: String(newsItem.id ?? ''),
    category: category as 'single' | 'multiple',
    title: popup.title || '',
    secondTitle: popup.second_title || '',
    content: popup.content || '',
    images: resolved.length ? resolved : [CMS_IMAGE_PLACEHOLDER],
    sequenceOrder: Number(popup.sequence_order) || 99,
  };
}

/** Home carousel — all published news rows from `/Api/news`. */
export function mapNewsToHomePopupSlides(
  newsItems: NewsRow[],
  toImageUrl: (value?: string) => string
): NewsPopupSlide[] {
  const slides: NewsPopupSlide[] = [];

  for (const newsItem of newsItems) {
    if (!isNewsRowPublished(newsItem)) continue;
    const popups = getPopupItemsForNewsRow(newsItem);
    popups.forEach((popup, index) => {
      const slide = popupToSlide(newsItem, popup, index, toImageUrl);
      if (slide) slides.push(slide);
    });
  }

  slides.sort((a, b) => (a.sequenceOrder ?? 99) - (b.sequenceOrder ?? 99));
  return slides;
}
