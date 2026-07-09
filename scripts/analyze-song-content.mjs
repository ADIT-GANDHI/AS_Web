/**
 * Score all CMS songs by on-page content richness (lyrics lines/chars, about, notes, glossary).
 * Usage: node scripts/analyze-song-content.mjs
 */
const BASE = 'https://ajab-admin.damnetworks.com/admin';
const CONCURRENCY = 8;

function htmlToMetrics(html) {
  if (!html || typeof html !== 'string') {
    return { chars: 0, lines: 0, stanzas: 0, maxLineLen: 0 };
  }
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n');
  const text = withBreaks
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .trim();
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const stanzas = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const maxLineLen = lines.length ? Math.max(...lines.map((l) => l.length)) : 0;
  return { chars: text.length, lines: lines.length, stanzas, maxLineLen };
}

function isJunkText(chars) {
  return chars > 0 && chars <= 10;
}

function scoreExploreSong(d) {
  const orig = htmlToMetrics(d.songLyricsOriginal);
  const translit = htmlToMetrics(d.Songtitle_transliteration || d.songLyricsTransliteration);
  const trans = htmlToMetrics(d.songLyricsTranslated);
  const lyricNotes = htmlToMetrics(d.songLyricsNotes);
  const about = htmlToMetrics(d.about);
  const notes = htmlToMetrics(d.notes);
  const glossary = htmlToMetrics(d.glossary || d.songglossary);

  const lyricLines = orig.lines + trans.lines + lyricNotes.lines;
  const lyricStanzas = orig.stanzas + trans.stanzas + lyricNotes.stanzas;
  const lyricChars = orig.chars + trans.chars + lyricNotes.chars;
  const maxLineLen = Math.max(orig.maxLineLen, trans.maxLineLen, lyricNotes.maxLineLen);

  const aboutChars = isJunkText(about.chars) ? 0 : about.chars;
  const notesChars = isJunkText(notes.chars) ? 0 : notes.chars;
  const glossaryChars = isJunkText(glossary.chars) ? 0 : glossary.chars;

  // Weight lyrics heavily — drives scroll height and stanza layout on detail page.
  const score =
    lyricLines * 12 +
    lyricStanzas * 8 +
    lyricChars * 0.15 +
    maxLineLen * 0.5 +
    aboutChars * 0.08 +
    notesChars * 0.2 +
    glossaryChars * 0.25 +
    (d.youtube_video_id || d.youtubeVideoId ? 15 : 0) +
    (d.thumbnail_url || d.thumbnailUrl ? 5 : 0);

  return {
    score,
    lyricLines,
    lyricStanzas,
    lyricChars,
    maxLineLen,
    aboutChars,
    notesChars,
    glossaryChars,
    origLines: orig.lines,
    transLines: trans.lines,
    lyricNotesLines: lyricNotes.lines,
    hasVideo: Boolean(d.youtube_video_id || d.youtubeVideoId),
    title:
      d.Songtitle_transliteration ||
      d.songtitletraan ||
      d.meta_title ||
      d.metaTitle ||
      `Song ${d.id}`,
    singer: d.singer || d.singer_display || '',
    poet: d.poet || d.poet_display || '',
  };
}

async function fetchAllSongIds() {
  const songs = [];
  let page = 1;
  let total = Infinity;
  while (songs.length < total && page <= 50) {
    const res = await fetch(
      `${BASE}/Api/list?page=${page}&limit=50&search=&singer=&poet=`
    );
    const json = await res.json();
    if (!Array.isArray(json?.data)) break;
    total = Number(json.total) || json.data.length;
    songs.push(...json.data);
    page += 1;
  }
  return songs;
}

async function fetchExplore(songId) {
  const res = await fetch(
    `${BASE}/Api/explore_songs?song_id=${encodeURIComponent(songId)}&language=english`,
    { signal: AbortSignal.timeout(45000) }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (json?.status === false) return null;
  return json?.data || json;
}

async function fetchRelatedCount(songId) {
  try {
    const res = await fetch(`${BASE}/Api/related?song_id=${encodeURIComponent(songId)}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return Number(json?.total_related) || 0;
  } catch {
    return 0;
  }
}

async function fetchVersionCount(songId) {
  try {
    const res = await fetch(`${BASE}/Api/song_versions?song_id=${encodeURIComponent(songId)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return 1;
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data.length : 0;
    return Math.max(rows, 1);
  } catch {
    return 1;
  }
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

function pickMedian(sorted, key) {
  const mid = Math.floor(sorted.length / 2);
  return sorted[mid];
}

async function enrichTop(row) {
  const [relatedCount, versionCount] = await Promise.all([
    fetchRelatedCount(row.id),
    fetchVersionCount(row.id),
  ]);
  return {
    ...row,
    relatedCount,
    versionCount,
    detailUrl: `/songs/details/${row.id}`,
    apiUrl: `${BASE}/Api/explore_songs?song_id=${row.id}`,
  };
}

async function main() {
  console.log('Fetching song catalog…');
  const catalog = await fetchAllSongIds();
  console.log(`Catalog: ${catalog.length} songs`);

  console.log('Scoring explore_songs payloads…');
  const scored = (
    await mapPool(catalog, CONCURRENCY, async (row) => {
      const detail = await fetchExplore(row.id);
      if (!detail) {
        return {
          id: String(row.id),
          title: row.Songtitle_transliteration || row.meta_title || `Song ${row.id}`,
          score: 0,
          error: 'no detail',
        };
      }
      const metrics = scoreExploreSong(detail);
      return { id: String(detail.id || row.id), ...metrics };
    })
  ).filter((r) => !r.error);

  scored.sort((a, b) => b.score - a.score);

  const most = scored[0];
  const least = scored[scored.length - 1];
  const medium = pickMedian(scored, 'score');

  console.log('Enriching top / median / least with related + versions…');
  const [mostFull, mediumFull, leastFull] = await Promise.all([
    enrichTop(most),
    enrichTop(medium),
    enrichTop(least),
  ]);

  const output = {
    analyzed: scored.length,
    most: mostFull,
    medium: mediumFull,
    least: leastFull,
    top10: scored.slice(0, 10).map((r) => ({
      id: r.id,
      title: r.title,
      score: Math.round(r.score),
      lyricLines: r.lyricLines,
    })),
    bottom10: scored.slice(-10).map((r) => ({
      id: r.id,
      title: r.title,
      score: Math.round(r.score),
      lyricLines: r.lyricLines,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
