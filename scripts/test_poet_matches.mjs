async function run() {
  const urlSongs = 'https://ajab.designanddevelopment.in/admin/Api/list?limit=1000';
  const urlPoets = 'https://ajab.designanddevelopment.in/admin/Api/poem_filters';

  try {
    const resSongs = await fetch(urlSongs);
    const jsonSongs = await resSongs.json();
    const allSongs = jsonSongs.data || [];

    const resPoets = await fetch(urlPoets);
    const jsonPoets = await resPoets.json();
    const fetchedPoets = (jsonPoets.data?.poets || [])
      .map(p => (p.poet_name || '').trim())
      .filter(Boolean);

    // Collapsed spaces and casing format, matching CLindex.tsx line 125
    const poetsSet = new Set();
    fetchedPoets.forEach((p) => {
      const cleaned = p.replace(/\s+/g, ' ').trim();
      if (cleaned) {
        const formatted = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        poetsSet.add(formatted);
      }
    });

    const formattedPoetList = Array.from(poetsSet).sort();
    console.log(`Formatted Poets Checklist Options (${formattedPoetList.length} total):`);
    console.log('Sample poets:', formattedPoetList.slice(0, 10));

    // Check if "Kabir" is in the checklist
    const hasKabir = formattedPoetList.includes('Kabir');
    console.log(`Is "Kabir" in formatted checklist options? ${hasKabir}`);

    // Map song fields exactly like CLindex.tsx
    const formattedSongs = allSongs.map((item) => ({
      id: item.id,
      title: item.Songtitle_transliteration || item.song_title || '',
      poet: item.poet || '', // Mapped from item.poet
      poet_display: item.poet_display || '',
      poet_names: item.poet_names || [],
    }));

    // Let's check how many songs match "Kabir" using the current filter logic:
    // song.poet is checked
    const matchingSongsCurrent = formattedSongs.filter((song) => {
      const poet = (song.poet || '').toLowerCase();
      return ['kabir'].some((name) => poet.includes(name.toLowerCase()));
    });
    console.log(`\nSongs matching "Kabir" using current logic (song.poet): ${matchingSongsCurrent.length}`);
    if (matchingSongsCurrent.length > 0) {
      console.log('Matches:', matchingSongsCurrent.map(s => s.title));
    }

    // Let's check why other Kabir songs did not match. Let's dump some song's poet field:
    const kabirSongsRaw = allSongs.filter(s => {
      const poetStr = JSON.stringify(s.poet_names || []) + ' ' + (s.poet || '') + ' ' + (s.poet_display || '');
      return poetStr.toLowerCase().includes('kabir');
    });

    console.log(`\nRaw Kabir songs in DB: ${kabirSongsRaw.length}`);
    console.log('Inspect poet fields of first 5 Kabir songs:');
    kabirSongsRaw.slice(0, 5).forEach((s, idx) => {
      console.log(`[Song ${idx+1}] ID: ${s.id} | Title: "${s.Songtitle_transliteration || s.song_title}"`);
      console.log(`  - s.poet: "${s.poet}"`);
      console.log(`  - typeof s.poet: ${typeof s.poet}`);
      console.log(`  - s.poet_display: "${s.poet_display}"`);
      console.log(`  - s.poet_names:`, s.poet_names);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
