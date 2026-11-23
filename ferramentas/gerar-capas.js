// Gera as imagens de capa (1200×630) usadas na prévia de links no WhatsApp, Instagram e afins.
// Uso: npm i --no-save @resvg/resvg-js && node ferramentas/gerar-capas.js <pasta com Montserrat e Jost .ttf>
//   → assets/capa-app.png (link de instalar) e assets/capa-site.png (página de vendas)
const fs = require('fs'), path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const raiz = path.join(__dirname, '..');
const pastaFontes = process.argv[2];
const fontes = fs.readdirSync(pastaFontes).filter(f => f.endsWith('.ttf')).map(f => path.join(pastaFontes, f));

const icone = fs.readFileSync(path.join(raiz, 'assets', 'icone.svg'), 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function capa({ selo, linha1, linha2, rodape }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g1" cx="1" cy="0" r="0.9"><stop offset="0" stop-color="#F3DCE0"/><stop offset="1" stop-color="#FBF6F5" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0" cy="1" r="0.8"><stop offset="0" stop-color="#F3E7D2"/><stop offset="1" stop-color="#FBF6F5" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#FBF6F5"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <circle cx="1190" cy="640" r="190" fill="none" stroke="#A7834A" stroke-opacity=".35" stroke-width="2"/>
  <circle cx="1190" cy="640" r="150" fill="none" stroke="#A0596A" stroke-opacity=".25" stroke-width="2"/>
  <svg x="96" y="175" width="280" height="280" viewBox="0 0 96 96">${icone}</svg>
  <text x="440" y="250" font-family="Montserrat" font-weight="600" font-size="26" letter-spacing="6" fill="#A7834A">${selo}</text>
  <text x="436" y="340" font-family="Montserrat" font-weight="300" font-size="92" fill="#2A1F22" letter-spacing="-1">Estoque<tspan font-weight="600" fill="#A0596A">On</tspan></text>
  <text x="440" y="405" font-family="Jost" font-size="36" fill="#6E5A5D">${linha1}</text>
  <text x="440" y="452" font-family="Jost" font-size="36" fill="#6E5A5D">${linha2}</text>
  <rect x="440" y="492" width="${rodape.length * 13.6 + 56}" height="58" rx="3" fill="#A0596A"/>
  <text x="468" y="530" font-family="Jost" font-weight="500" font-size="27" fill="#FFFFFF">${rodape}</text>
</svg>`;
}
const capas = {
  'capa-app.png': capa({ selo: 'APP PARA O CELULAR', linha1: 'Vendas pelo QR da etiqueta, estoque,', linha2: 'caixa e clientes da sua loja.', rodape: 'Toque para instalar' }),
  'capa-site.png': capa({ selo: 'GESTÃO PARA SEMIJOIAS', linha1: 'Estoque, preço e vendas da sua loja,', linha2: 'com a sua marca e as suas cores.', rodape: 'Conheça os planos' })
};
for (const [nome, svg] of Object.entries(capas)) {
  const png = new Resvg(svg, { font: { fontFiles: fontes, loadSystemFonts: false, defaultFontFamily: 'Jost' }, fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  fs.writeFileSync(path.join(raiz, 'assets', nome), png);
  console.log(nome, png.length, 'bytes');
}
