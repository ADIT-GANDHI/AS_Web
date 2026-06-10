// Probing raw API endpoint

async function run() {
  const url = 'https://ajab.designanddevelopment.in/admin/Api/list?limit=5';
  console.log(`Fetching raw songs from: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('API Status:', data?.status);
    console.log('Total Count:', data?.total);
    if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
      const first = data.data[0];
      console.log('\n--- RAW KEYS OF FIRST SONG ITEM ---');
      console.log(Object.keys(first));
      
      console.log('\n--- FIRST SONG RAW CONTENT ---');
      console.log(JSON.stringify(first, null, 2));

      console.log('\n--- SINGER & POET KEY VALUES FOR ALL 5 ITEMS ---');
      data.data.forEach((item, idx) => {
        console.log(`\n[Song ${idx + 1}] Title: "${item.Songtitle_transliteration || item.song_title}"`);
        console.log(`  - singer:`, item.singer);
        console.log(`  - singer_display:`, item.singer_display);
        console.log(`  - singer_names:`, item.singer_names);
        console.log(`  - poet:`, item.poet);
        console.log(`  - poet_display:`, item.poet_display);
        console.log(`  - poet_names:`, item.poet_names);
        console.log(`  - meta_keywords:`, item.meta_keywords);
        console.log(`  - metaKeyword:`, item.metaKeyword);
        console.log(`  - keywords:`, item.keywords);
      });
    }
  } catch (err) {
    console.error('Error fetching raw items:', err);
  }
}

run();
