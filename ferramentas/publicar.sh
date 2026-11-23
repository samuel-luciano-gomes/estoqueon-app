#!/usr/bin/env bash
# Monta a pasta publicada pelo Cloudflare Pages (comando de build: bash ferramentas/publicar.sh, saída: dist).
# Só entram as páginas e os arquivos do site. Banco (supabase/), ferramentas, README e testes ficam de fora.
set -euo pipefail
rm -rf dist
mkdir -p dist
cp -r assets dist/
cp *.html manifest.webmanifest sw.js _headers dist/
rm -f dist/teste-*.html
echo "Publicado:"; ls dist
