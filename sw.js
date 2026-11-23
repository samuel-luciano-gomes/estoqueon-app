// EstoqueOn — service worker: abre o app rápido e mesmo com sinal fraco.
// Páginas: rede primeiro (sempre a versão nova). Arquivos estáticos: cache primeiro.
// Nunca guarda nada do Supabase (dados da loja e login).
const VERSAO = 'eo-v7';
const BASE = ['./celular.html', './entrar.html', './instalar.html', './assets/base.css', './assets/celular.css', './assets/celular.js', './assets/conta.js', './assets/config.js', './assets/nfe.js',
  './assets/fonts/montserrat-latin-wght-normal.woff2', './assets/fonts/jost-latin-wght-normal.woff2', './assets/icones/icone-192-v2.png', './manifest.webmanifest'];

// Respostas que passaram por redirecionamento (/celular.html → /celular) não podem ser devolvidas a uma navegação.
const limpa = r => r && r.redirected ? r.blob().then(b => new Response(b, { status: r.status, statusText: r.statusText, headers: r.headers })) : r;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(BASE.map(u => fetch(u).then(limpa).then(r => r.ok && c.put(u, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/supabase\.co$/.test(url.hostname)) return;
  const pagina = req.mode === 'navigate' || /\.(html|js|css)$/.test(url.pathname) && url.origin === location.origin;
  if (pagina) {
    e.respondWith(fetch(req).then(r => { if (r.ok && r.type === 'basic' && !r.redirected) { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(m => m || caches.match(url.pathname.replace(/\/$/, '/index') + (/\.html$/.test(url.pathname) ? '' : '.html'), { ignoreSearch: true }))
        .then(limpa)));
  } else if (url.origin === location.origin || /cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); } return r; })));
  }
});
