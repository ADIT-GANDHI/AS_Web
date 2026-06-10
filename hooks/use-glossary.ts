import { useState, useEffect } from 'react';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

interface GlossaryItem {
  id: string;
  glossary_term: string;
  glossary_meaning: string;
  poetic_images: string;
  poetic_image_description: string;
  related_songs: string;
  related_poems: string;
  song_names: string;
  poem_names: string;
  etymology: string;
  cultural_context: string;
  examples: string;
  is_published: string;
  meta_title: string;
  meta_keywords: string;
  meta_description: string;
  date_created: string;
  date_updated: string;
}

interface GlossaryResponse {
  status: boolean;
  total: number;
  data: GlossaryItem[];
}

const makeItem = (
  id: string,
  term: string,
  devanagari: string,
  meaning: string,
): GlossaryItem => ({
  id,
  glossary_term: `${term} (${devanagari})`,
  glossary_meaning: meaning,
  poetic_images: '',
  poetic_image_description: '',
  related_songs: '',
  related_poems: '',
  song_names: '',
  poem_names: '',
  etymology: '',
  cultural_context: '',
  examples: '',
  is_published: '1',
  meta_title: '',
  meta_keywords: '',
  meta_description: '',
  date_created: '',
  date_updated: '',
});

// Offline fallback derived from Figma artwork 1:26851
const MOCK_GLOSSARY: GlossaryItem[] = [
  makeItem(
    '1',
    'Agam Nigam',
    'अगम-निगम, agām nigām',
    "Literally, the pathless path or difficult way. 'Agam' means the place to which there is no path, or difficult to get to. It also that which lies beyond the intellect. 'Nigam' means path or way. It also means the 'vedas' (therefore, a holy scripture which lies beyond the intellect). With this paradox, similar to 'unstruck sound', the poet signals a real destination but one which lies beyond our usual understanding of the world.",
  ),
  makeItem(
    '2',
    'Alakh',
    'अलख, alakh',
    'That which is invisible or unmanifest. It suggests the idea of that which lies beyond the senses, or to which there is no path. Traditionally, it has been used as a description of God or the divine, but it is used with a different connotation in the nirgun strand of mystic poetry.',
  ),
  makeItem(
    '3',
    'Amrit',
    'अमृत, amrit',
    'The nectar of heaven has been a familiar metaphor in many traditions across the ages. The etymology of the English word descends from the Greek, nek-tar (death-overcoming). In Hindi it has the same root. In mystic poetry, amrit is also referred to as "ras", that is, sap, fluid, or juice, or the taste or essence of something; and sometimes simply as paani, water, or even boond, drops.',
  ),
  makeItem(
    '4',
    'Heli',
    'हेली, helī',
    'A short form of saheli — female friend or companion. Songs addressed to the heli belong to a whole genre of Kabir songs in Rajasthan, and may have reached Malwa from there. The address is intimate and personal, because this friend dwells in your own heart and consciousness. So in a sense, the poem is a conversation with yourself.',
  ),
  makeItem(
    '5',
    'Sahaj',
    'सहज, sahaj',
    'Spontaneous, simple or natural. Saha = together with; ja = being born or arising; ie, arising together.',
  ),
];

export const useGlossary = () => {
  const [glossaryData, setGlossaryData] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlossary = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${AJAB_API_BASE}/Api/glossary`);

        if (!response.ok) {
          throw new Error(`Failed to fetch glossary: ${response.statusText}`);
        }

        const data: GlossaryResponse = await response.json();

        /* [Claude] these changes have been recommended by claude —
           Use mock if API data looks like test data:
           - term longer than 60 chars → repeated placeholder text
           - meaning shorter than 30 chars after stripping HTML → "cxvcghkjN" etc. */
        const isReal = (item: GlossaryItem) => {
          const termOk = item.glossary_term?.length > 0 && item.glossary_term.length <= 60;
          const meaningText = (item.glossary_meaning || '')
            .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const meaningOk = meaningText.length >= 30;
          return termOk && meaningOk;
        };

        if (data.status && Array.isArray(data.data) && data.data.length) {
          const meaningful = data.data.filter(isReal);
          setGlossaryData(meaningful.length >= 3 ? meaningful : MOCK_GLOSSARY);
        } else {
          throw new Error('Invalid response format');
        }
      } catch {
        // API offline → use mock content so page still renders the Figma layout
        setGlossaryData(MOCK_GLOSSARY);
      } finally {
        setLoading(false);
      }
    };

    fetchGlossary();
  }, []);

  return { glossaryData, loading, error };
};
