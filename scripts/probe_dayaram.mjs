async function run() {
  const url = 'https://ajab.designanddevelopment.in/admin/Api/list?limit=1000';
  console.log(`Fetching all songs from: ${url}`);
  try {
    const res = await fetch(url);
    const json = await res.json();
    const songs = json.data || [];
    
    const dayaramSongs = songs.filter(s => {
      const singerStr = JSON.stringify(s.singer_names || []) + ' ' + (s.singer || '') + ' ' + (s.singer_display || '');
      return singerStr.toLowerCase().includes('dayaram') || singerStr.toLowerCase().includes('saroliya');
    });

    console.log(`Found ${dayaramSongs.length} songs with Dayaram/Saroliya.`);
    dayaramSongs.forEach((s, idx) => {
      console.log(`\n[Song ${idx + 1}] ID: ${s.id} | Title: "${s.Songtitle_transliteration || s.song_title}"`);
      console.log(`  - singer: "${s.singer}"`);
      console.log(`  - singer_display: "${s.singer_display}"`);
      console.log(`  - singer_names:`, s.singer_names);
    });
  } catch (err) {
    console.error(err);
  }
}

run();
