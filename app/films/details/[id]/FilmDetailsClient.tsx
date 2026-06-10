'use client';

import FilmDetailsPage, { LanguageVersion } from '@/components/Films/FilmDetailsPage';
import { getPublishedFilms } from '@/lib/services/filmsService';
import { getFilmById } from '@/lib/services/filmsService';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Extract language from title like "~ Chalo Hamara Des (Kannada)" → "Kannada"
function extractLanguageFromTitle(title?: string): string {
  if (!title) return '';
  const match = title.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : '';
}

// Get base title by removing "~ " prefix and "(Language)" suffix
function getBaseTitle(title?: string): string {
  if (!title) return '';
  return title
    .replace(/^~\s*/, '')
    .replace(/\s*\([^)]+\)\s*$/, '')
    .trim()
    .toLowerCase();
}

export default function FilmDetailsClient({ id }: { id: string }) {
  const params = useParams<{ id?: string }>();
  const filmId = String(params?.id || id || '').trim();

  const [film, setFilm] = useState<any>(null);
  const [relatedFilms, setRelatedFilms] = useState<any[]>([]);
  const [languageVersions, setLanguageVersions] = useState<LanguageVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!filmId) return;

    setLoading(true);
    setFilm(null);
    setRelatedFilms([]);
    setLanguageVersions([]);

    getFilmById(filmId)
      .then(async (filmData) => {
        const currentFilm = filmData?.status === false ? null : filmData?.data || null;
        setFilm(currentFilm);

        if (currentFilm) {
          try {
            const listPayload = await getPublishedFilms();
            const listItems = Array.isArray(listPayload?.data) ? listPayload.data : [];

            // Find language versions of the same film
            const currentTitle = currentFilm?.english_transliteration || '';
            const currentBase = getBaseTitle(currentTitle);
            const currentLang = extractLanguageFromTitle(currentTitle) || 'Original';
            const currentVid = currentFilm?.youtube_video_id || '';

            const versions: LanguageVersion[] = [];

            if (currentVid) {
              versions.push({
                id: String(currentFilm.id),
                language: currentLang,
                videoId: currentVid,
              });
            }

            // Scan nearby film IDs to find language variants
            // Films with language versions have titles like "~ Title (Hindi)", "~ Title (Kannada)"
            if (currentBase) {
              const currentIdNum = parseInt(String(currentFilm.id), 10);
              const scanIds: number[] = [];
              // Scan IDs around the current film (language variants are usually nearby)
              for (let i = Math.max(1, currentIdNum - 10); i <= currentIdNum + 10; i++) {
                if (i !== currentIdNum) scanIds.push(i);
              }

              const results = await Promise.all(
                scanIds.map((scanId) => getFilmById(String(scanId)).catch(() => null))
              );

              for (const res of results) {
                const d = res?.data;
                if (!d) continue;
                const otherTitle = d.english_transliteration || '';
                const otherBase = getBaseTitle(otherTitle);
                const otherLang = extractLanguageFromTitle(otherTitle);
                const otherVid = d.youtube_video_id || '';
                if (otherBase === currentBase && otherLang && otherVid) {
                  versions.push({
                    id: String(d.id),
                    language: otherLang,
                    videoId: otherVid,
                  });
                }
              }
            }

            setLanguageVersions(versions);

            // Related films (exclude language versions)
            const versionIds = new Set(versions.map((v) => v.id));

            const sameDirector = listItems.filter((item: any) => {
              return (
                !versionIds.has(String(item?.id || '')) &&
                String(item?.id || '') !== String(currentFilm?.id || '') &&
                String(item?.director_name_english || '').trim() &&
                String(item?.director_name_english || '').trim() ===
                  String(currentFilm?.director_name_english || '').trim()
              );
            });

            const fallback = listItems.filter(
              (item: any) =>
                !versionIds.has(String(item?.id || '')) &&
                String(item?.id || '') !== String(currentFilm?.id || '')
            );

            const merged = [...sameDirector, ...fallback].reduce((acc: any[], item: any) => {
              if (!acc.some((existing) => String(existing?.id) === String(item?.id))) {
                acc.push(item);
              }
              return acc;
            }, []);

            setRelatedFilms(merged.slice(0, 6));
          } catch {
            setRelatedFilms([]);
          }
        }

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [filmId]);

  return (
    <FilmDetailsPage
      data={film}
      isLoading={loading}
      relatedFilms={relatedFilms}
      languageVersions={languageVersions}
    />
  );
}
