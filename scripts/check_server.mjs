import http from 'http';
http.get('http://localhost:3000/songs', (r) => {
  console.log('HTTP Status:', r.statusCode);
  r.destroy();
}).on('error', (e) => console.error('Server error:', e.message));
