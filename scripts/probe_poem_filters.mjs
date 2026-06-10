async function run() {
  const url1 = 'https://ajab.designanddevelopment.in/admin/Api/poem_filters';
  const url2 = 'https://ajab.designanddevelopment.in/admin/Api/song_filters';
  
  console.log(`Fetching poem_filters: ${url1}`);
  try {
    const res = await fetch(url1);
    const json = await res.json();
    console.log('Poem Filters Status:', json.status);
    console.log('Poem Filters Keys:', Object.keys(json.data || {}));
    if (json.data?.poets) {
      console.log(`Poem Filters Poets length: ${json.data.poets.length}`);
      console.log('First 5 poets in poem_filters:');
      json.data.poets.slice(0, 5).forEach(p => console.log(p));
    }
  } catch (e) {
    console.error(e);
  }

  console.log(`\nFetching song_filters: ${url2}`);
  try {
    const res = await fetch(url2);
    const json = await res.json();
    console.log('Song Filters Status:', json.status);
    console.log('Song Filters Keys:', Object.keys(json.data || {}));
    if (json.data) {
      Object.keys(json.data).forEach(k => {
        console.log(`  - key "${k}" has length: ${json.data[k]?.length}`);
      });
      if (json.data.poets) {
        console.log('First 5 poets in song_filters:');
        json.data.poets.slice(0, 5).forEach(p => console.log(p));
      }
    }
  } catch (e) {
    console.error(e);
  }
}

run();
