// Minimal statisk server for lokal titting — ingen deps.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };

createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/])+/, '');
    const file = join(ROOT, path === '' ? 'impact.html' : path);
    if (!file.startsWith(normalize(ROOT))) throw new Error('utenfor rot');
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('404');
  }
}).listen(4173, () => console.log('http://localhost:4173/impact.html'));
