const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const TOTAL_FRAMES = 238;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS & caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // API endpoint
  if (pathname === '/api/frames-info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalFrames: TOTAL_FRAMES,
      width: 1920,
      height: 1080,
      aspectRatio: 16 / 9,
      prefix: '/frame/',
      suffix: '.jpg'
    }));
    return;
  }

  // Frame route: /frame/1.jpg or /frame/001.jpg
  const frameMatch = pathname.match(/^\/frame\/(\d+)\.jpg$/);
  if (frameMatch) {
    const frameNum = parseInt(frameMatch[1], 10);
    if (frameNum >= 1 && frameNum <= TOTAL_FRAMES) {
      const pad = String(frameNum).padStart(3, '0');
      const filename = path.join(__dirname, `ezgif-frame-${pad} (5).jpg`);
      
      if (fs.existsSync(filename)) {
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        const stream = fs.createReadStream(filename);
        stream.pipe(res);
        return;
      }
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Frame not found');
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

function startServer(port) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`ZEFRAN Scrollytelling Server running at http://localhost:${port}`);
    console.log(`Frames configured: 1 to ${TOTAL_FRAMES} (2K 1920x1080)`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = PORT + 1;
    console.warn(`Port ${PORT} in use, attempting port ${nextPort}...`);
    startServer(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);
