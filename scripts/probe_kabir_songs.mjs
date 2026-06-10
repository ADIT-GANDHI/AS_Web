async function run() {
  const url = 'https://ajab.designanddevelopment.in/admin/Api/list?limit=1000';
  const res = await fetch(url);
  const json = await res.json();
  const songs = json.data || [];
  
  console.log('Total songs fetched:', songs.length);
  
  const kabirSongs = songs.filter(s => {
    const poetStr = JSON.stringify(s.poet_names || []) + ' ' + (s.poet || '') + ' ' + (s.poet_display || '');
    return poetStr.toLowerCase().includes('kabir');
  });

  console.log(`\nFound ${kabirSongs.length} songs referencing "Kabir" in poet fields.`);
  console.log('\nFirst 10 Kabir songs raw fields:');
  kabirSongs.slice(0, 10).forEach((s, idx) => {
    console.log(`[Song ${idx+1}] ID: ${s.id} | Title: "${s.Songtitle_transliteration || s.song_title}"`);
    console.log(`  - poet: "${s.poet}"`);
    console.log(`  - poet_display: "${s.poet_display}"`);
    console.log(`  - poet_names:`, s.poet_names);
  });
}

run();
