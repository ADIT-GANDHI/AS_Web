import { REFLECTIONS_FILTER } from '@/components/Reflections/constants';
import { getPublishedReflections } from '@/lib/services/reflectionsService';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import useSWR from 'swr';

interface IProps {
  activeFilter?: string;
}

const ASSET_BASE_URL = AJAB_API_BASE;

const toArray = (value: any) => (Array.isArray(value) ? value : []);

const toAbsoluteUrl = (value: any) => {
  const source = String(value || '').trim();
  if (!source) return '';
  if (/^https?:\/\//i.test(source)) return source;
  return `${ASSET_BASE_URL}/${source.replace(/^\/+/, '')}`;
};

const pickText = (...values: any[]) =>
  values.find((value) => typeof value === 'string' && value.trim().length > 0) || '';

const useReflections = ({ activeFilter = REFLECTIONS_FILTER[0] }: IProps = {}) => {
  const { data, error, isLoading } = useSWR<any>('reflections', getPublishedReflections, {
    revalidateOnFocus: false,
  });

  const rawRows = toArray(data?.data?.reflections || data?.data || data?.reflections || data);

  const reflectionMap = new Map<string | number, any>();

  rawRows.forEach((row: any, index: number) => {
    const id = row?.id || row?.reflection_id || row?.reflectionId || `reflection-${index}`;
    const title = pickText(
      row?.title,
      row?.meta_title,
      row?.reflection_title_english,
      row?.english_title,
      row?.name
    );
    const excerpt = pickText(
      row?.excerpt,
      row?.meta_description,
      row?.description,
      row?.about_text,
      row?.summary
    );
    const speakerName = pickText(
      row?.speaker_name,
      row?.speaker?.name,
      row?.person_name_english,
      row?.person_name,
      row?.author
    );
    const poetName = pickText(row?.poet_name, row?.poet?.name, row?.attributed_poet);
    let type = pickText(row?.content_type, row?.type, row?.reflection_type, row?.format);
    if (!type) {
      if (row?.essay_content) type = 'Essay';
      else if (row?.visual_story_desc) type = 'Visual Story';
      else if (row?.audio_story_title || row?.audio_story_editor) type = 'Audio Story';
      else if (row?.interview_video || row?.interview_audio || row?.interview_text || row?.interview_about || row?.youtube_video_id) type = 'Interview';
    }

    reflectionMap.set(id, {
      id,
      metaTitle: title || 'Untitled Reflection',
      metaDescription: excerpt,
      thumbnailURL: toAbsoluteUrl(
        row?.thumbnail_url || row?.thumbnailURL || row?.thumbnail || row?.thumbnail_image_upload || row?.image
      ),
      speaker: speakerName,
      speakerId: row?.speaker_id || row?.speakerId || '',
      verb: row?.verb || '',
      thumbnailExcerpt: row?.thumbnail_excerpt || row?.thumbnailExcerpt || '',
      poets: poetName ? [{ name: poetName }] : [],
      contentType: type,
      youtubeVideoId: row?.youtube_video_id || row?.youtubeVideoId || '',
    });
  });

  const uniqueReflections = [...reflectionMap.values()];

  const filteredResults =
    activeFilter === 'ALL'
      ? uniqueReflections
      : uniqueReflections.filter((item: any) =>
          String(item?.metaTitle || '')
            .toLowerCase()
            .startsWith(activeFilter.toLowerCase())
        );

  return {
    reflections: filteredResults,
    totalResults: filteredResults.length,
    isLoading,
    error,
  };
};

export default useReflections;
