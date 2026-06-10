/**
 * Probe all Ajab CMS endpoints used by the frontend.
 * Usage: node scripts/probe-cms-apis.mjs
 */
const BASE = process.env.AJAB_API_BASE || 'https://ajab.designanddevelopment.in/admin';

const endpoints = [
  { name: 'home', url: '/Api/home' },
  { name: 'news', url: '/Api/news' },
  { name: 'list', url: '/Api/list?page=1&limit=5&search=&singer=&poet=' },
  { name: 'song_filters', url: '/Api/song_filters' },
  { name: 'poems', url: '/Api/poems?page=1&limit=5' },
  { name: 'poem_filters', url: '/Api/poem_filters' },
  { name: 'reflection_list', url: '/Api/reflection_list?page=1&limit=5' },
  { name: 'reflection_filter', url: '/Api/reflection_filter' },
  { name: 'person_list', url: '/Api/person_list?page=1&limit=5' },
  { name: 'film_list', url: '/Api/film_list?page=1&limit=5' },
  { name: 'glossary', url: '/Api/glossary' },
  { name: 'about', url: '/Api/about' },
  { name: 'nitesh', url: '/Api/nitesh?search=ram' },
];

function keysOf(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 2) return [];
  if (Array.isArray(obj)) {
    if (obj.length === 0) return ['(empty array)'];
    return keysOf(obj[0], depth + 1);
  }
  return Object.keys(obj);
}

function countItems(json) {
  if (Array.isArray(json?.data)) return json.data.length;
  if (json?.data && typeof json.data === 'object') {
    const sub = Object.values(json.data).filter(Array.isArray);
    if (sub.length) return sub.map((a) => a.length).join('+');
  }
  if (Array.isArray(json)) return json.length;
  return null;
}

async function probe({ name, url }) {
  const full = `${BASE}${url}`;
  const t0 = Date.now();
  try {
    const res = await fetch(full, { signal: AbortSignal.timeout(20000) });
    const ms = Date.now() - t0;
    const ct = res.headers.get('content-type') || '';
    let json = null;
    let parseError = null;
    if (ct.includes('json') || ct.includes('text')) {
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch (e) {
        parseError = text.slice(0, 200);
      }
    }
    return { name, url, full, status: res.status, ok: res.ok, ms, ct, json, parseError };
  } catch (e) {
    return { name, url, full, status: 0, ok: false, ms: Date.now() - t0, error: String(e.message || e) };
  }
}

async function main() {
  console.log(`BASE: ${BASE}\n`);
  const results = [];
  for (const ep of endpoints) {
    results.push(await probe(ep));
  }

  // Dynamic explore endpoints from first items
  const listRes = results.find((r) => r.name === 'list');
  const songId = listRes?.json?.data?.[0]?.id;
  if (songId) {
    results.push(await probe({ name: 'explore_songs', url: `/Api/explore_songs?song_id=${songId}&language=hindi` }));
    results.push(await probe({ name: 'related_song', url: `/Api/related?song_id=${songId}` }));
    results.push(await probe({ name: 'song_versions', url: `/Api/song_versions?song_id=${songId}` }));
  }

  const poemsRes = results.find((r) => r.name === 'poems');
  const poemId = poemsRes?.json?.data?.[0]?.id;
  if (poemId) {
    results.push(await probe({ name: 'poems_by_id', url: `/Api/poems?id=${poemId}` }));
  }

  const reflRes = results.find((r) => r.name === 'reflection_list');
  const reflId = reflRes?.json?.data?.[0]?.id;
  if (reflId) {
    results.push(await probe({ name: 'explore_reflection', url: `/Api/explore_reflection?reflection_id=${reflId}` }));
  }

  const personRes = results.find((r) => r.name === 'person_list');
  const personId = personRes?.json?.data?.[0]?.id;
  if (personId) {
    results.push(await probe({ name: 'explore_person', url: `/Api/explore_person?person_id=${personId}` }));
  }

  const filmRes = results.find((r) => r.name === 'film_list');
  const filmId = filmRes?.json?.data?.[0]?.id;
  if (filmId) {
    results.push(await probe({ name: 'explore_film', url: `/Api/explore_film?film_id=${filmId}` }));
  }

  for (const r of results) {
    console.log('---');
    console.log(`${r.name}: ${r.status} (${r.ms}ms)`);
    console.log(r.full);
    if (r.error) console.log('ERROR:', r.error);
    if (r.parseError) console.log('PARSE:', r.parseError);
    if (r.json) {
      console.log('topKeys:', Object.keys(r.json).join(', '));
      console.log('status field:', r.json.status);
      console.log('count:', countItems(r.json), 'total:', r.json.total ?? r.json.count ?? '—');
      const sampleKeys = keysOf(r.json.data ?? r.json.latest ?? r.json);
      console.log('sampleKeys:', sampleKeys.slice(0, 25).join(', '));
      // Filter-specific
      if (r.name === 'song_filters' && r.json?.data) {
        console.log('song_filters.data keys:', Object.keys(r.json.data).join(', '));
        for (const k of Object.keys(r.json.data)) {
          const arr = r.json.data[k];
          if (Array.isArray(arr) && arr[0]) console.log(`  ${k}[0]:`, Object.keys(arr[0]).join(', '));
        }
      }
      if (r.name === 'poem_filters' && r.json?.data) {
        console.log('poem_filters.data keys:', Object.keys(r.json.data).join(', '));
      }
      if (r.name === 'reflection_filter' && r.json?.data) {
        console.log('reflection_filter.data keys:', Object.keys(r.json.data).join(', '));
      }
      if (r.name === 'list' && r.json?.data?.[0]) {
        const s = r.json.data[0];
        console.log('sample song singer/poet/theme:', s.singer_name, s.poet_name, s.theme);
      }
      if (r.name === 'explore_songs' && r.json?.data) {
        console.log('explore_songs data keys:', Object.keys(r.json.data).join(', '));
      }
    }
  }

  // Write JSON for doc generation
  const out = results.map((r) => ({
    name: r.name,
    url: r.url,
    status: r.status,
    ok: r.ok,
    ms: r.ms,
    error: r.error,
    topKeys: r.json ? Object.keys(r.json) : null,
    apiStatus: r.json?.status,
    count: r.json ? countItems(r.json) : null,
    total: r.json?.total ?? r.json?.count ?? null,
    sample: r.json?.data?.[0] ?? r.json?.latest ?? null,
    fullData: r.json,
  }));
  const fs = await import('fs');
  fs.writeFileSync('scripts/probe-cms-apis-output.json', JSON.stringify(out, null, 2));
  console.log('\nWrote scripts/probe-cms-apis-output.json');
}

main();
