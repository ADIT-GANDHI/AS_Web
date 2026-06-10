async function run() {
  const url = 'https://ajab.designanddevelopment.in/admin/Api/song_filters';
  console.log(`Fetching song_filters: ${url}`);
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.data && json.data.poet) {
      console.log(`poet length: ${json.data.poet.length}`);
      console.log('First 20 items in song_filters.poet:');
      json.data.poet.slice(0, 20).forEach((p, idx) => {
        console.log(`  [${idx}]`, p);
      });
    }
  } catch (e) {
    console.error(e);
  }
}

run();
