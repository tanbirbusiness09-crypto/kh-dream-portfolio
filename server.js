/** Zero-dependency development server: npm start -> http://localhost:3000 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT || 3000);
const types = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.svg':'image/svg+xml',
  '.webp':'image/webp',
  '.png':'image/png',
  '.ico':'image/x-icon',
  '.txt':'text/plain; charset=utf-8',
};
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad Request'); return; }
  const full = path.resolve(root, '.'+pathname.replace(/^\/+/, '/'));
  if(full !== root && !full.startsWith(root + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  let file = full;
  try { if(fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); }
  catch { res.writeHead(404); res.end('Not Found'); return; }
  const stream = fs.createReadStream(file);
  stream.on('error', () => { if (!res.headersSent) res.writeHead(404); res.end('Not Found'); });
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-cache');
  stream.pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Executive Dimension running at http://localhost:${port}`));
