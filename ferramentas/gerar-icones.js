// Gera os ícones PNG do app (anel dourado com ponto rosê) sem dependências.
// Uso: node ferramentas/gerar-icones.js  →  assets/icones/*.png
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const saida = path.join(__dirname, '..', 'assets', 'icones');
fs.mkdirSync(saida, { recursive: true });

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const FUNDO = hex('#FBF6F5'), OURO = hex('#A7834A'), ROSE = hex('#A0596A'), BLUSH = hex('#F3DDE1');

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xffffffff) >>> 0;
}
function bloco(tipo, dados) {
  const t = Buffer.from(tipo), len = Buffer.alloc(4), crc = Buffer.alloc(4);
  len.writeUInt32BE(dados.length); crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([len, t, dados, crc]);
}
function png(tam, pixel) {
  const linhas = Buffer.alloc((tam * 4 + 1) * tam);
  const SS = 4; // supersampling para bordas suaves
  for (let y = 0; y < tam; y++) {
    linhas[y * (tam * 4 + 1)] = 0;
    for (let x = 0; x < tam; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = pixel((x + (sx + .5) / SS) / tam, (y + (sy + .5) / SS) / tam);
        r += c[0] * c[3]; g += c[1] * c[3]; b += c[2] * c[3]; a += c[3];
      }
      const o = y * (tam * 4 + 1) + 1 + x * 4, n = SS * SS;
      linhas[o] = a ? Math.round(r / a) : 0; linhas[o + 1] = a ? Math.round(g / a) : 0; linhas[o + 2] = a ? Math.round(b / a) : 0; linhas[o + 3] = Math.round(a / n * 255);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(tam, 0); ihdr.writeUInt32BE(tam, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloco('IHDR', ihdr), bloco('IDAT', zlib.deflateSync(linhas, { level: 9 })), bloco('IEND', Buffer.alloc(0))]);
}
// escala: tamanho do desenho em relação ao ícone (maskable precisa de margem de segurança)
function desenho(escala, cantos) {
  return (u, v) => {
    const x = u - .5, y = v - .5, d = Math.hypot(x, y) / escala;
    if (cantos) { const r = .22, ax = Math.max(Math.abs(x) - (.5 - r), 0), ay = Math.max(Math.abs(y) - (.5 - r), 0); if (Math.hypot(ax, ay) > r) return [0, 0, 0, 0]; }
    if (d < .1) return [...ROSE, 1];
    if (d < .135) return [...BLUSH, 1];
    if (d > .29 && d < .345) return [...OURO, 1];
    return [...FUNDO, 1];
  };
}
const arquivos = {
  'icone-192.png': png(192, desenho(1, true)),
  'icone-512.png': png(512, desenho(1, true)),
  'icone-maskable-512.png': png(512, desenho(.78, false)),
  'apple-touch-icon.png': png(180, desenho(.9, false))
};
for (const [n, b] of Object.entries(arquivos)) fs.writeFileSync(path.join(saida, n), b);
console.log('Ícones gerados em', saida);
