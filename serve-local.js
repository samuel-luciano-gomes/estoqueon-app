// Servidor só para testar no computador: node serve-local.js  →  http://localhost:4330
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = process.env.PORT || 4330;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, path.normalize(p).replace(/^([.][.][\/\\])+/, ''));
  if (!f.startsWith(root) || /[\/\\](supabase|ferramentas|\.git)[\/\\]/.test(f)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' }); res.end(d);
  });
}).listen(port, () => console.log('EstoqueOn em http://localhost:' + port));
