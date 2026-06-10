import { getPoemFilters, getPublishedPoems } from '@/lib/services/poemsService';
import useSWR from 'swr';

function stripHtml(input?: string | null) {
  if (!input) return '';
  const noTags = input.replace(/<[^>]*>/g, '');
  return noTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

interface ApiPoem {
  id: string;
  original_title: string;
  couplet_transliteration: string;
  couplet_translation: string;
  related_songs: string;
  soundCloud_track_url: string | null;
  related_reflections: string;
  related_words: string;
  related_films: string;
  related_filmEpisode: string;
  related_couplets: string;
  related_people: string;
  related_stories: string;
  attributed_poet: string;
  translator: string | null;
  poet_id: string | null;
  soundCloud_iD: string;
  original_text: string;
  english_transliteration_text: string;
  english_translation_text: string;
  note_text: string;
  glossary: string | null;
  thumbnail_url: string;
  thumbnail_image_upload: string | null;
  show_on_landing_page: string;
  is_published: string;
  meta_title: string;
  meta_keywords: string;
  keywords: string | null;
  thumbnail_excerpt: string | null;
  meta_description: string;
  created_at: string;
}

interface UIPoem extends ApiPoem {
  title: string;
  englishTransliteration: string;
  englishTranslation: string;
  metaDescription: string;
  poet: {
    id: string;
    name: string;
  };
  poets: Array<{ id: number; name: string }>;
  singers: Array<{ id: number; name: string }>;
  thumbnail: string;
  songTitle: {
    englishTransliteration: string;
  };
  metaTitle: string;
}

interface PoemsResponse {
  status?: boolean;
  theme?: string;
  poet?: string;
  total?: number;
  data: ApiPoem[];
}

interface PoemFiltersResponse {
  data?: {
    poets?: Array<{ id: string; poet_name: string }>;
    themes?: Array<{
      id: string;
      word_transliteration?: string;
      word?: string;
      theme?: string;
      name?: string;
    }>;
  };
}

interface FilterOption {
  id: string;
  label: string;
  queryValue?: string;
}

interface IProps {
  activeFilter?: string;
  selectedPoets?: string[];
  selectedThemes?: string[];
}

const usePoems = ({ activeFilter = 'ALL', selectedPoets = [], selectedThemes = [] }: IProps = {}) => {
  const { data: filtersData } = useSWR<PoemFiltersResponse>('poem-filters', getPoemFilters, {
    revalidateOnFocus: false,
  });

  const poetOptions: FilterOption[] = Array.from(
    new Map(
      (filtersData?.data?.poets || [])
        .map((item) => ({
          id: String(item?.id || '').trim(),
          label: (item?.poet_name || '').replace(/\s+/g, ' ').trim(),
        }))
        .filter((item) => item.id && item.label)
        .map((item) => [item.id, item])
    ).values()
  );

  const themeOptions: FilterOption[] = Array.from(
    new Map(
      (filtersData?.data?.themes || [])
        .map((item) => ({
          id: String(item?.id || '').trim(),
          label: (item?.word_transliteration || item?.word || item?.theme || item?.name || '')
            .replace(/\s+/g, ' ')
            .trim(),
          queryValue: (item?.word || item?.word_transliteration || item?.theme || item?.name || '')
            .replace(/\s+/g, ' ')
            .trim(),
        }))
        .filter((item) => item.id && item.label)
        .map((item) => [item.id, item])
    ).values()
  );

  const selectedPoetId = selectedPoets[0] || '';
  const selectedThemeQuery = themeOptions.find((item) => item.id === selectedThemes[0])?.queryValue || '';

  const poemsKey = ['published-poems', selectedPoets.join(','), selectedThemes.join(',')];
  const { data, error, isLoading } = useSWR<PoemsResponse | ApiPoem[]>(
    poemsKey,
    () =>
      getPublishedPoems({
        poet: selectedPoetId || undefined,
        theme: selectedThemeQuery || undefined,
      }),
    { revalidateOnFocus: false }
  );

  const apiPoems: ApiPoem[] = Array.isArray(data) ? data : data?.data || [];
  const poetNameById = new Map(poetOptions.map((item) => [item.id, item.label]));

  const poems: UIPoem[] = apiPoems.map((item) => {
    const poetId = String(item.poet_id || item.id || '').trim();
    const cleanAttributedPoet = stripHtml(item.attributed_poet);
    const attributedLooksLikeId = /^\d+$/.test(cleanAttributedPoet);
    const resolvedPoetName =
      (!attributedLooksLikeId && cleanAttributedPoet) || poetNameById.get(poetId) || 'Unknown';

    return {
    ...item,
    id: item.id,
    title: item.original_title,
    original_text: stripHtml(item.original_text),
    english_transliteration_text: stripHtml(item.english_transliteration_text),
    english_translation_text: stripHtml(item.english_translation_text),
    note_text: stripHtml(item.note_text),
    englishTransliteration: stripHtml(item.english_transliteration_text) || item.original_title,
    englishTranslation: stripHtml(item.english_translation_text),
    poet: {
      id: poetId,
      name: resolvedPoetName,
    },
    coupletTransliteration: item.couplet_transliteration,
    coupletTranslation: item.couplet_translation,
    about: item.meta_description,
    meta_description: stripHtml(item.meta_description),
    metaDescription: stripHtml(item.meta_description),
    poets: resolvedPoetName ? [{ id: Number(poetId) || 0, name: resolvedPoetName }] : [],
    singers: [],
    thumbnail: item.thumbnail_url,
    songTitle: {
      englishTransliteration: item.original_title,
    },
    metaTitle: item.meta_title,
    };
  });

  const byTopFilter =
    activeFilter === 'ALL'
      ? poems
      : poems.filter((item) => (item.metaTitle || '').toLowerCase().startsWith(activeFilter.toLowerCase()));

  const filteredPoems = byTopFilter;

  const shuffledPoems = filteredPoems.slice().sort(() => Math.random() - 0.5);
  const visiblePoems = shuffledPoems.slice(0, 5);
  const totalPoems = Array.isArray(data) ? filteredPoems.length : (data?.total ?? filteredPoems.length);

  return {
    publishedPoems: filteredPoems,
    totalPoems,
    shuffledPoems,
    visiblePoems,
    poetOptions,
    themeOptions,
    isLoading,
    error,
  };
};

export default usePoems;
