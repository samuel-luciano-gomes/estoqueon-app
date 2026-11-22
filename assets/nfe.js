// EstoqueOn — leitura do XML da NF-e e sugestão de associação com as peças da loja.
(function (raiz) {
  'use strict';
  const NS = 'http://www.portalfiscal.inf.br/nfe';

  function txt(el, nome) {
    if (!el) return '';
    let n = el.getElementsByTagNameNS(NS, nome)[0] || el.getElementsByTagName(nome)[0];
    return n ? n.textContent.trim() : '';
  }
  function todos(el, nome) {
    const a = el.getElementsByTagNameNS(NS, nome);
    return Array.from(a.length ? a : el.getElementsByTagName(nome));
  }

  // Devolve { chave, numero, serie, emissao, fornecedor, cnpj, valor_total, itens: [{codigo, ean, descricao, ncm, unidade, qtd, custo, total}] }
  function lerNFe(xmlTexto) {
    const doc = new DOMParser().parseFromString(xmlTexto, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('O arquivo não é um XML válido.');
    const inf = todos(doc, 'infNFe')[0];
    if (!inf) throw new Error('Este XML não é de uma NF-e. Peça ao fornecedor o arquivo XML da nota.');
    const chave = (inf.getAttribute('Id') || '').replace(/\D/g, '') || txt(doc, 'chNFe');
    const ide = todos(inf, 'ide')[0], emit = todos(inf, 'emit')[0], tot = todos(inf, 'ICMSTot')[0];
    const itens = todos(inf, 'det').map(det => {
      const p = todos(det, 'prod')[0];
      const qtd = parseFloat(txt(p, 'qCom')) || 0;
      const vProd = parseFloat(txt(p, 'vProd')) || 0;
      const vDesc = parseFloat(txt(p, 'vDesc')) || 0;
      const ean = txt(p, 'cEAN');
      return {
        codigo: txt(p, 'cProd'),
        ean: /^\d{8,14}$/.test(ean) ? ean : '',
        descricao: txt(p, 'xProd'),
        ncm: txt(p, 'NCM'),
        unidade: txt(p, 'uCom'),
        qtd,
        custo: qtd ? Math.round((vProd - vDesc) / qtd * 100) / 100 : 0,
        total: Math.round((vProd - vDesc) * 100) / 100
      };
    });
    return {
      chave,
      numero: txt(ide, 'nNF'),
      serie: txt(ide, 'serie'),
      emissao: (txt(ide, 'dhEmi') || txt(ide, 'dEmi')).slice(0, 10),
      fornecedor: txt(emit, 'xFant') || txt(emit, 'xNome'),
      cnpj: txt(emit, 'CNPJ') || txt(emit, 'CPF'),
      valor_total: parseFloat(txt(tot, 'vNF')) || itens.reduce((s, i) => s + i.total, 0),
      itens
    };
  }

  const PARADAS = new Set(['de', 'da', 'do', 'com', 'e', 'em', 'para', 'p', 'c', 'un', 'und', 'pc', 'pcs', 'banho', 'folheado', 'semijoia', 'semi', 'joia']);
  function normal(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').trim();
  }
  function palavras(s) { return normal(s).split(/\s+/).filter(w => w.length > 1 && !PARADAS.has(w)); }
  function semelhanca(a, b) {
    const A = new Set(palavras(a)), B = new Set(palavras(b));
    if (!A.size || !B.size) return 0;
    let comum = 0; A.forEach(w => { if (B.has(w)) comum++; });
    return comum / (A.size + B.size - comum);
  }

  // Para cada item da nota, sugere a peça: código do fornecedor ou EAN iguais; senão, nome parecido.
  function associar(itens, produtos) {
    return itens.map(it => {
      const cod = normal(it.codigo).replace(/ /g, '');
      let p = cod && produtos.find(x => normal(x.skuF).replace(/ /g, '') === cod);
      if (p) return { produto: p, motivo: 'código do fornecedor', confianca: 1 };
      p = it.ean && produtos.find(x => x.ean === it.ean);
      if (p) return { produto: p, motivo: 'código de barras', confianca: 1 };
      let melhor = null, nota = 0;
      produtos.forEach(x => { const s = semelhanca(it.descricao, x.nome); if (s > nota) { nota = s; melhor = x; } });
      if (melhor && nota >= 0.5) return { produto: melhor, motivo: 'nome parecido', confianca: nota };
      return { produto: null, motivo: '', confianca: 0 };
    });
  }

  // Nome amigável a partir da descrição da nota ("BRINCO ARGOLA MEDIA LISA DOURADO" → "Brinco argola media lisa dourado")
  function nomeAmigavel(desc) {
    const s = String(desc || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const CATS = [['brinco', 'Brincos'], ['argola', 'Brincos'], ['ear', 'Brincos'], ['colar', 'Colares'], ['gargantilha', 'Colares'], ['choker', 'Colares'], ['corrente', 'Colares'],
    ['pingente', 'Pingentes'], ['pulseira', 'Pulseiras'], ['bracelete', 'Pulseiras'], ['anel', 'Anéis'], ['tornozeleira', 'Tornozeleiras'], ['conjunto', 'Conjuntos'], ['piercing', 'Piercings']];
  function categoria(desc) { const n = normal(desc); const c = CATS.find(([k]) => n.includes(k)); return c ? c[1] : ''; }

  const api = { lerNFe, associar, semelhanca, nomeAmigavel, categoria };
  if (typeof module !== 'undefined') module.exports = api; else raiz.NFe = api;
})(typeof window !== 'undefined' ? window : globalThis);
