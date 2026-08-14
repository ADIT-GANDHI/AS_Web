/** Shared helpers for `/Api/film_list` (mixed series headers + standalone films). */

export type FilmListSeriesRaw = {
  type?: string;
  title?: string;
  priority?: number | string;
  description?: string;
  series_description?: string;
  films?: Record<string, unknown>[];
};

/** Default header for root-level films with no series wrapper (user choice 1A). */
export const DEFAULT_FILM_SERIES_TITLE = 'Journeys with Kabir';

/** 1 = top, 999 = least. Invalid / missing → 999. */
export function parseFilmPriority(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 999;
  return Math.min(999, Math.max(1, Math.round(n)));
}

export function compareFilmPriority(a: number, b: number): number {
  return a - b;
}

export function isFilmListSeriesRow(row: unknown): row is FilmListSeriesRaw {
  if (!row || typeof row !== 'object') return false;
  const r = row as Record<string, unknown>;
  return r.type === 'series' || Array.isArray(r.films);
}

export function isFilmListFilmRow(row: unknown): row is Record<string, unknown> {
  if (!row || typeof row !== 'object') return false;
  const r = row as Record<string, unknown>;
  if (isFilmListSeriesRow(r)) return false;
  return r.type === 'film' || 'youtube_video_id' in r || 'english_transliteration' in r || 'id' in r;
}

function sortFilmsByPriority(films: Record<string, unknown>[]): Record<string, unknown>[] {
  return films.slice().sort((a, b) =>
    compareFilmPriority(parseFilmPriority(a.priority), parseFilmPriority(b.priority))
  );
}

/** Flatten mixed payload → unique films by id (for detail language tabs / counts helpers). */
export function flattenFilmListItems(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];

  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];

  const push = (film: Record<string, unknown>) => {
    const id = String(film.id || '').trim();
    if (id) {
      if (seen.has(id)) return;
      seen.add(id);
    }
    out.push(film);
  };

  for (const row of data) {
    if (isFilmListSeriesRow(row)) {
      const films = Array.isArray(row.films) ? row.films : [];
      for (const film of films) {
        if (film && typeof film === 'object') push(film as Record<string, unknown>);
      }
      continue;
    }
    if (isFilmListFilmRow(row)) push(row);
  }

  return out;
}

export function countFilmsInListPayload(data: unknown): number {
  return flattenFilmListItems(data).length;
}

export type NormalizedFilmSeries = {
  title: string;
  priority: number;
  intro: string;
  films: Record<string, unknown>[];
};

function sortSeries(list: NormalizedFilmSeries[]): NormalizedFilmSeries[] {
  return list
    .slice()
    .sort(
      (a, b) =>
        compareFilmPriority(a.priority, b.priority) || a.title.localeCompare(b.title)
    );
}

/**
 * Normalize `/Api/film_list` into priority-sorted series.
 * Mixed payload supported:
 * - `type: "series"` → header + nested films (duplicates across series kept — 2A)
 * - root `type: "film"` → collected under DEFAULT_FILM_SERIES_TITLE (1A)
 * Unpublished films are kept (show anyway).
 */
export function normalizeFilmListSeries(
  data: unknown,
  fallbackIntro: string,
  defaultSeriesTitle: string = DEFAULT_FILM_SERIES_TITLE
): NormalizedFilmSeries[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  const byTitle = new Map<string, NormalizedFilmSeries>();

  const ensure = (title: string, priority: number, intro: string) => {
    const key = title.trim();
    const existing = byTitle.get(key);
    if (existing) {
      existing.priority = Math.min(existing.priority, priority);
      if (!existing.intro && intro) existing.intro = intro;
      return existing;
    }
    const created: NormalizedFilmSeries = {
      title: key,
      priority,
      intro: intro || fallbackIntro,
      films: [],
    };
    byTitle.set(key, created);
    return created;
  };

  const appendFilms = (bucket: NormalizedFilmSeries, films: Record<string, unknown>[]) => {
    // Within one header, keep first occurrence of an id (page merges may repeat).
    const seen = new Set(
      bucket.films.map((f) => String(f.id || '').trim()).filter(Boolean)
    );
    for (const film of films) {
      if (!film || typeof film !== 'object') continue;
      const id = String(film.id || '').trim();
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      bucket.films.push(film);
    }
  };

  const orphanFilms: Record<string, unknown>[] = [];

  for (const row of data) {
    if (isFilmListSeriesRow(row)) {
      const title = String(row.title || '').trim();
      if (!title) continue;
      const films = (Array.isArray(row.films) ? row.films : []).filter(
        (f) => f && typeof f === 'object'
      ) as Record<string, unknown>[];
      if (!films.length) continue;
      const bucket = ensure(
        title,
        parseFilmPriority(row.priority),
        String(row.description || row.series_description || '').trim() || fallbackIntro
      );
      appendFilms(bucket, films);
      continue;
    }

    if (isFilmListFilmRow(row)) {
      orphanFilms.push(row);
    }
  }

  if (orphanFilms.length) {
    const bucket = ensure(defaultSeriesTitle, 999, fallbackIntro);
    appendFilms(bucket, orphanFilms);
  }

  for (const series of byTitle.values()) {
    series.films = sortFilmsByPriority(series.films);
  }

  return sortSeries(Array.from(byTitle.values()).filter((s) => s.films.length > 0));
}

/** Merge series pages for Load more (5A). Same title → combine films; cross-series duplicates kept. */
export function mergeFilmListSeries(
  prev: NormalizedFilmSeries[],
  next: NormalizedFilmSeries[]
): NormalizedFilmSeries[] {
  const byTitle = new Map<string, NormalizedFilmSeries>();

  for (const s of [...prev, ...next]) {
    const existing = byTitle.get(s.title);
    if (!existing) {
      byTitle.set(s.title, {
        title: s.title,
        priority: s.priority,
        intro: s.intro,
        films: [...s.films],
      });
      continue;
    }
    existing.priority = Math.min(existing.priority, s.priority);
    if (s.intro && existing.intro.length < s.intro.length) existing.intro = s.intro;
    const seen = new Set(
      existing.films.map((f) => String(f.id || '').trim()).filter(Boolean)
    );
    for (const film of s.films) {
      const id = String(film.id || '').trim();
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      existing.films.push(film);
    }
  }

  for (const series of byTitle.values()) {
    series.films = sortFilmsByPriority(series.films);
  }

  return sortSeries(Array.from(byTitle.values()));
}
