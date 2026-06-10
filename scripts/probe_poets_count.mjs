async function run() {
  const url = 'https://ajab.designanddevelopment.in/admin/Api/list?limit=1000';
  console.log(`Fetching all songs from: ${url}`);
  try {
    const res = await fetch(url);
    const json = await res.json();
    const songs = json.data || [];
    console.log('Total songs fetched:', songs.length);
    
    const poetsMap = new Map();
    const singersMap = new Map();
    
    songs.forEach(song => {
      const p = String(song.poet || '').trim();
      const s = String(song.singer || '').trim();
      const sd = String(song.singer_display || '').trim();
      const sn = song.singer_names || [];

      // Poets count
      if (p) {
        poetsMap.set(p, (poetsMap.get(p) || 0) + 1);
      }

      // Singers count
      const singerId = sd || s || sn[0] || '';
      if (singerId) {
        singersMap.set(singerId, (singersMap.get(singerId) || 0) + 1);
      }
    });

    console.log('\n--- POETS DENSITY (Top 20 raw counts) ---');
    const sortedPoets = Array.from(poetsMap.entries()).sort((a,b) => b[1] - a[1]);
    sortedPoets.slice(0, 20).forEach(([poet, count]) => {
      console.log(`  - "${poet}": ${count} songs`);
    });

    console.log('\n--- SINGERS DENSITY (Top 20 raw counts) ---');
    const sortedSingers = Array.from(singersMap.entries()).sort((a,b) => b[1] - a[1]);
    sortedSingers.slice(0, 20).forEach(([singer, count]) => {
      console.log(`  - "${singer}": ${count} songs`);
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
