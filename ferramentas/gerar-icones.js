// Gera os ícones PNG do app a partir dos desenhos em SVG (etiqueta com QR).
// Uso: npm i --no-save @resvg/resvg-js && node ferramentas/gerar-icones.js  →  assets/icones/*.png
// - assets/icone.svg ............ ícone com cantos arredondados (aba do navegador, Android "any")
// - ferramentas/icone-maskable.svg  fundo inteiro e desenho na área segura (Android adaptativo, iPhone)
const fs = require('fs'), path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const raiz = path.join(__dirname, '..');
const saida = path.join(raiz, 'assets', 'icones');
fs.mkdirSync(saida, { recursive: true });

const normal = fs.readFileSync(path.join(raiz, 'assets', 'icone.svg'), 'utf8');
const cheio = fs.readFileSync(path.join(__dirname, 'icone-maskable.svg'), 'utf8');
const png = (svg, tam) => new Resvg(svg, { fitTo: { mode: 'width', value: tam } }).render().asPng();

const arquivos = {
  'icone-192.png': png(normal, 192),
  'icone-512.png': png(normal, 512),
  'icone-maskable-512.png': png(cheio, 512),
  'apple-touch-icon.png': png(cheio, 180),
  'favicon-32.png': png(normal, 32)
};
for (const [n, b] of Object.entries(arquivos)) fs.writeFileSync(path.join(saida, n), b);
console.log('Ícones gerados em', saida);
