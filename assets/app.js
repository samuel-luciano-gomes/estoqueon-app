// EstoqueOn — sistema da loja (painel, produtos, leitor, vendas, histórico, ajustes) sobre o Supabase.
(function () {
'use strict';
const sb = () => EO.cliente();

const ICONS = {
  painel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  produtos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18 3-18"/></svg>',
  leitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M11 8v8M15 8v8M18 8v8"/></svg>',
  vendas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>',
  historico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>',
  ajustes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>'
};

/* ---------- paletas de marca ---------- */
const PALETAS = {
  rose: { nome: 'Rosê', desc: 'Ouro rosé e blush', sw: ['#A0596A', '#E8C4C4', '#A7834A'],
    light: { bg: '#FBF7F6', surface: '#FFFFFF', 'surface-2': '#F6EDEB', ink: '#2B1F22', muted: '#85706F', line: '#EEDFDC', accent: '#A0596A', 'accent-ink': '#FFFFFF', 'accent-soft': '#F7E6E8', gold: '#A7834A', 'gold-soft': '#F5ECDD' },
    dark: { bg: '#171213', surface: '#201819', 'surface-2': '#2A2022', ink: '#F4E9E8', muted: '#B39D9E', line: '#3A2C2E', accent: '#E3A7B1', 'accent-ink': '#2A1317', 'accent-soft': '#3A2328', gold: '#D9B77A', 'gold-soft': '#2F2618' } },
  gold: { nome: 'Champagne', desc: 'Dourado e marfim', sw: ['#8C6A2F', '#E9DCC0', '#B0707B'],
    light: { bg: '#FAF8F3', surface: '#FFFFFF', 'surface-2': '#F3EEE3', ink: '#26211A', muted: '#7C7262', line: '#E9E1D1', accent: '#8C6A2F', 'accent-ink': '#FFFFFF', 'accent-soft': '#F4ECDC', gold: '#A4636E', 'gold-soft': '#F6E8E8' },
    dark: { bg: '#15130F', surface: '#1D1A15', 'surface-2': '#27231C', ink: '#F2ECE0', muted: '#ADA290', line: '#38322A', accent: '#D9B977', 'accent-ink': '#231B0C', 'accent-soft': '#332A19', gold: '#E0A9B2', 'gold-soft': '#33222A' } },
  perola: { nome: 'Pérola', desc: 'Branco, preto e ouro', sw: ['#1C1B1A', '#F3F1EC', '#A8864E'],
    light: { bg: '#FFFFFF', surface: '#FFFFFF', 'surface-2': '#F7F6F3', ink: '#1C1B1A', muted: '#77736E', line: '#ECE9E4', accent: '#1C1B1A', 'accent-ink': '#FFFFFF', 'accent-soft': '#F2F0EC', gold: '#A08048', 'gold-soft': '#F6F0E4' },
    dark: { bg: '#121211', surface: '#1A1A19', 'surface-2': '#242322', ink: '#F3F1EC', muted: '#A7A39C', line: '#33312E', accent: '#F3F1EC', 'accent-ink': '#121211', 'accent-soft': '#2A2927', gold: '#D4B57E', 'gold-soft': '#2C261B' } }
};
function aplicarMarca() {
  const p = PALETAS[S && S.marca.paleta] || PALETAS.rose;
  const decl = o => Object.entries(o).map(([k, v]) => `--${k}:${v}`).join(';');
  let el = document.getElementById('brandcss');
  if (!el) { el = document.createElement('style'); el.id = 'brandcss'; document.head.appendChild(el); }
  el.textContent = `:root{${decl(p.light)}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${decl(p.dark)};color-scheme:dark}}:root[data-theme="dark"]{${decl(p.dark)};color-scheme:dark}`;
}
const inicial = n => (String(n || '').trim().replace(/^(ateli[eê]|loja|studio|casa)\s+/i, '')[0] || 'E').toUpperCase();

/* ---------- utilidades ---------- */
const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = v => (Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const hoje = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const dmy = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7);
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_L = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const mesLbl = k => MESES[Number(k.slice(5, 7)) - 1] + '/' + k.slice(2, 4);
const mesLongo = k => MESES_L[Number(k.slice(5, 7)) - 1] + ' de ' + k.slice(0, 4);
const mesAnt = k => { let y = +k.slice(0, 4), m = +k.slice(5, 7) - 1; if (m < 1) { m = 12; y--; } return y + '-' + pad(m); };
const dias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const num = v => { const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
const numIn = v => { const s = String(v).trim(); const n = parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s); return isFinite(n) ? n : 0; };
const fone = d => { d = String(d || '').replace(/\D/g, ''); return d.length === 11 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7) : d; };
const wa = (d, msg) => 'https://wa.me/55' + String(d || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
const saud = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
const dataHora = iso => { const d = new Date(iso); return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };

/* ---------- regras de preço (iguais às do banco) ---------- */
const rateio = S => S.insumos.reduce((s, i) => s + (i.qtd > 0 ? i.total / i.qtd : 0), 0);
const custoTotal = (S, p) => p.custo + rateio(S);
const arred = (S, v) => { if (!S.settings.arredondar) return Math.round(v * 100) / 100; let r = Math.floor(v) + 0.9; if (r < v - 1e-9) r += 1; return Math.round(r * 100) / 100; };
const calcVista = (S, p) => arred(S, custoTotal(S, p) * S.settings.markup / (1 - S.settings.imposto / 100));
const vistaPraticado = (S, p) => p.preco != null ? p.preco : calcVista(S, p);
const cartaoDe = (S, v) => arred(S, v / (1 - S.settings.taxaCartao / 100));
const precoPara = (S, p, pag) => pag === 'cartao' ? cartaoDe(S, vistaPraticado(S, p)) : vistaPraticado(S, p);
const calcPara = (S, p, pag) => pag === 'cartao' ? cartaoDe(S, calcVista(S, p)) : calcVista(S, p);
const liquido = (S, preco, pag) => preco * (1 - S.settings.imposto / 100) * (pag === 'cartao' ? 1 - S.settings.taxaCartao / 100 : 1);
const lucroItem = (S, preco, custoU, pag) => liquido(S, preco, pag) - custoU;
const estoque = (S, sku) => { const p = prod(S, sku); return p ? p.estoque : 0; };
const diasParado = (S, sku) => { const p = prod(S, sku); const ref = p && (p.ultVenda || p.primEntrada); return ref ? dias(ref, hoje()) : 0; };
const prod = (S, sku) => S.produtos.find(p => p.sku === sku);
const prodId = (S, id) => S.produtos.find(p => p.id === id);
const cli = (S, id) => S.clientes.find(c => c.id === id);
const margem = (S, p) => { const v = vistaPraticado(S, p); return v > 0 ? lucroItem(S, v, custoTotal(S, p), 'vista') / v * 100 : 0; };

/* ---------- estado ---------- */
let ctx = { user: null, perfil: null, master: false, lojas: [], lojaId: null, papel: null, planos: [] };
let S = null;
let ui = { tab: 'painel', mode: 'venda', cart: [], pag: 'vista', parc: 1, cliente: '', novoNome: '', novoWa: '', entrada: [], conf: {}, sel: [], filtro: 'todos', q: '', mes: null, vmes: 'todos', copias: {}, ultima: null, etiquetas: false, ocupado: false,
  hist: { tabela: 'todas', pag: 0, itens: null, fim: false }, equipe: null, aj: (function () { try { return localStorage.getItem('eo-aj') || 'marca'; } catch (e) { return 'marca'; } })() };
const dona = () => ctx.papel === 'dona';
const TABS = () => [['painel', 'Painel'], ['produtos', 'Produtos'], ['leitor', 'Leitor'], ['vendas', 'Vendas']]
  .concat(dona() ? [['historico', 'Histórico']] : []).concat([['ajustes', 'Ajustes']]);
const plano = () => ctx.planos.find(p => p.id === (S && S.loja.plano)) || { nome: 'Simples', max_pecas: 300, max_usuarias: 1, max_lojas: 1 };
try { const t = localStorage.getItem('eo-tab'); if (t) ui.tab = t; } catch (e) {}

/* ---------- toast ---------- */
function toast(msg, kind) { const box = document.getElementById('toast'); const el = document.createElement('div'); el.className = 't' + (kind ? ' ' + kind : ''); el.textContent = msg; box.appendChild(el); setTimeout(() => el.remove(), kind === 'bad' ? 5000 : 2600); }
function falha(e) { console.error(e); toast(traduz(e), 'bad'); }
function traduz(e) {
  const m = String((e && (e.message || e.details)) || e || '');
  if (/duplicate key.*sku/i.test(m)) return 'Já existe uma peça com esse código. Tente salvar de novo.';
  if (/duplicate key.*convites/i.test(m)) return 'Esse e-mail já foi convidado.';
  if (/row-level security|permission denied/i.test(m)) return 'Você não tem permissão para essa alteração.';
  if (/JWT|session/i.test(m)) return 'Sua sessão expirou. Entre de novo.';
  return EO.erro(e);
}

/* ---------- carregamento ---------- */
async function carregarContexto() {
  const uid = ctx.user.id;
  const [perf, mast, mem, pls] = await Promise.all([
    sb().from('perfis').select('*').eq('id', uid).maybeSingle(),
    sb().from('masters').select('user_id').eq('user_id', uid).maybeSingle(),
    sb().from('membros').select('papel, lojas(*)').eq('user_id', uid),
    sb().from('planos').select('*').order('ordem')
  ]);
  if (mem.error) throw mem.error;
  ctx.perfil = perf.data || { nome: '', email: ctx.user.email };
  ctx.master = !!mast.data;
  ctx.planos = pls.data || [];
  ctx.lojas = (mem.data || []).filter(m => m.lojas).map(m => ({ papel: m.papel, loja: m.lojas }))
    .sort((a, b) => a.loja.criado_em.localeCompare(b.loja.criado_em));
  let salva = null; try { salva = localStorage.getItem('eo-loja'); } catch (e) {}
  const atual = ctx.lojas.find(l => l.loja.id === salva) || ctx.lojas[0];
  ctx.lojaId = atual ? atual.loja.id : null;
  ctx.papel = atual ? atual.papel : null;
}

async function carregarLoja() {
  const id = ctx.lojaId;
  const desde = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
  const [lj, ins, prs, cls, vds] = await Promise.all([
    sb().from('lojas').select('*').eq('id', id).single(),
    sb().from('insumos').select('*').eq('loja_id', id).order('id'),
    sb().from('produtos_estoque').select('*').eq('loja_id', id).eq('ativo', true).order('sku'),
    sb().from('clientes').select('*').eq('loja_id', id).order('nome'),
    sb().from('vendas').select('*, venda_itens(*)').eq('loja_id', id).gte('data', desde).order('data').order('numero')
  ]);
  for (const r of [lj, ins, prs, cls, vds]) if (r.error) throw r.error;
  const l = lj.data;
  const produtos = prs.data.map(p => ({ id: p.id, sku: p.sku, nome: p.nome, cat: p.categoria, forn: p.fornecedor, skuF: p.sku_fornecedor,
    custo: Number(p.custo), preco: p.preco == null ? null : Number(p.preco), min: p.estoque_minimo, estoque: Number(p.estoque),
    ultVenda: p.ultima_venda, primEntrada: p.primeira_entrada }));
  const skuDe = {}; produtos.forEach(p => skuDe[p.id] = p.sku);
  S = {
    loja: l,
    marca: { nome: l.nome, assinatura: l.assinatura, insta: l.instagram, paleta: l.paleta },
    settings: { markup: Number(l.markup), taxaCartao: Number(l.taxa_cartao), imposto: Number(l.imposto), arredondar: l.arredondar },
    insumos: ins.data.map(i => ({ id: i.id, nome: i.nome, tipo: i.tipo, total: Number(i.total), qtd: i.qtd })),
    produtos,
    clientes: cls.data.map(c => ({ id: c.id, nome: c.nome, wa: c.whatsapp })),
    vendas: vds.data.map(v => ({ id: v.numero, dbid: v.id, data: v.data, cliente: v.cliente_id, pag: v.pagamento, parc: v.parcelas,
      total: Number(v.total), lucro: Number(v.lucro),
      itens: v.venda_itens.map(i => ({ sku: skuDe[i.produto_id] || ('#' + i.produto_id), pid: i.produto_id, qtd: i.qtd, preco: Number(i.preco), custoUnit: Number(i.custo_unit), calc: Number(i.calc), lucro: Number(i.lucro) })) }))
  };
  const me = ctx.lojas.find(x => x.loja.id === id); if (me) me.loja = l;
}
async function recarregar() { try { await carregarLoja(); render(); } catch (e) { falha(e); } }

/* ---------- navegação ---------- */
function renderTop() {
  const m = S.marca;
  const sel = ctx.lojas.length > 1
    ? `<select id="troca-loja" aria-label="Trocar de loja">${ctx.lojas.map(x => `<option value="${x.loja.id}" ${x.loja.id === ctx.lojaId ? 'selected' : ''}>${esc(x.loja.nome)}</option>`).join('')}</select>`
    : `<div class="brand-name">${esc(m.nome || 'Sua loja')}</div>`;
  document.getElementById('brand').innerHTML = `<span class="mono-mark" aria-hidden="true">${esc(inicial(m.nome))}</span><div style="min-width:0">${sel}<div class="brand-by">EstoqueOn · plano ${esc(plano().nome)}</div></div>`;
  const tabs = TABS(); if (!tabs.some(t => t[0] === ui.tab)) ui.tab = 'painel';
  document.getElementById('tabs').innerHTML = tabs.map(([k, l]) => `<button data-act="tab" data-k="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}>${ICONS[k]}<span>${l}</span></button>`).join('');
  document.getElementById('who').innerHTML = (ctx.master ? '<a class="btn ghost" href="master.html">Master</a>' : '') + '<a class="btn ghost" href="celular.html">Celular</a><button class="btn ghost" data-act="sair">Sair</button>';
}
function render() {
  const a = document.activeElement; const fid = a && a.id; let ss = null, se = null;
  const typing = a && a.tagName === 'INPUT' && a.type !== 'checkbox' && a.type !== 'file' ? a.value : null;
  try { if (fid && a.selectionStart != null) { ss = a.selectionStart; se = a.selectionEnd; } } catch (e) {}
  aplicarMarca(); renderTop();
  const v = document.getElementById('view');
  v.innerHTML = ({ painel: vPainel, produtos: vProdutos, leitor: vLeitor, vendas: vVendas, historico: vHistorico, ajustes: vAjustes })[ui.tab]();
  drawQR(v);
  const navAj = v.querySelector(".aj-nav"), atualAj = navAj && navAj.querySelector("[aria-current=page]");
  if (atualAj && navAj.scrollWidth > navAj.clientWidth) navAj.scrollLeft = atualAj.offsetLeft - navAj.offsetLeft - (navAj.clientWidth - atualAj.offsetWidth) / 2;
  if (fid) { const el = document.getElementById(fid); if (el) { if (typing != null && el.tagName === 'INPUT') el.value = typing; el.focus({ preventScroll: true }); try { if (ss != null) el.setSelectionRange(ss, se); } catch (e) {} } }
  if (ui.tab === 'historico' && ui.hist.itens === null) carregarHistorico();
  if (ui.tab === 'ajustes' && dona() && ui.equipe === null) carregarEquipe();
}
function tela(titulo, texto, extra) {
  document.getElementById('tabs').innerHTML = '';
  document.getElementById('who').innerHTML = (ctx.master ? '<a class="btn ghost" href="master.html">Master</a>' : '') + '<a class="btn ghost" href="celular.html">Celular</a><button class="btn ghost" data-act="sair">Sair</button>';
  document.getElementById('view').innerHTML = `<div class="locked"><span class="eyebrow">EstoqueOn</span><h2>${titulo}</h2><p>${texto}</p>${extra || ''}</div>`;
}

/* ---------- PAINEL ---------- */
function mesesDisponiveis() { const set = new Set(S.vendas.map(v => v.data.slice(0, 7))); set.add(hoje().slice(0, 7)); return [...set].sort(); }
function resumoMes(k) { const vs = S.vendas.filter(v => v.data.startsWith(k)); return { vs, f: vs.reduce((s, v) => s + v.total, 0), l: vs.reduce((s, v) => s + v.lucro, 0), p: vs.reduce((s, v) => s + v.itens.reduce((a, i) => a + i.qtd, 0), 0) }; }
function delta(a, b) { if (!b) return a ? '<span class="delta up">novo</span>' : ''; const d = (a - b) / b * 100; const c = Math.abs(d) < 0.5 ? 'flat' : d > 0 ? 'up' : 'down'; return `<span class="delta ${c}">${d > 0 ? '▲' : d < 0 ? '▼' : '•'} ${pct(Math.abs(d))}</span>`; }
function vPainel() {
  const ms = mesesDisponiveis();
  const atual = hoje().slice(0, 7);
  const m = ui.mes || atual;
  const R = resumoMes(m), P = resumoMes(mesAnt(m));
  const vs = R.vs, fat = R.f, luc = R.l, pecas = R.p;
  const emEst = S.produtos.reduce((s, p) => s + Math.max(0, p.estoque) * custoTotal(S, p), 0);
  const emEstV = S.produtos.reduce((s, p) => s + Math.max(0, p.estoque) * vistaPraticado(S, p), 0);
  const baixos = S.produtos.filter(p => p.estoque <= p.min);
  const parados = S.produtos.filter(p => p.estoque > 0 && diasParado(S, p.sku) > 45);
  const abaixo = []; vs.forEach(v => v.itens.forEach(i => { if (i.preco < i.calc - 0.005) abaixo.push({ v, i }); }));
  const perda = abaixo.reduce((s, x) => s + (x.i.calc - x.i.preco) * x.i.qtd, 0);
  const idx = ms.indexOf(m); const meses = ms.slice(Math.max(0, idx - 5), idx + 1);
  const serie = meses.map(k => { const r = resumoMes(k); return { k, f: r.f, l: r.l }; });
  const mxRaw = Math.max(1, ...serie.map(s => s.f)); const step = Math.pow(10, Math.floor(Math.log10(mxRaw))); const mx = Math.ceil(mxRaw / step * 2) / 2 * step;
  const W = 560, H = 210, top = 18, base = 170, ch = base - top, gw = (W - 44) / serie.length, bw = Math.min(34, gw / 3);
  const fmtEixo = v => v >= 1000 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : Math.round(v).toLocaleString('pt-BR');
  const grid = [0, .5, 1].map(t => { const y = base - t * ch; return `<line x1="44" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)" ${t ? 'stroke-dasharray="2 4"' : ''}/><text x="38" y="${y + 4}" text-anchor="end">${fmtEixo(mx * t)}</text>`; }).join('');
  const bars = serie.map((s, i) => { const cx = 44 + gw * i + gw / 2; const hf = s.f / mx * ch, hl = Math.max(0, s.l) / mx * ch; const cur = s.k === m; return `<g><rect x="${cx - bw - 2}" y="${base - hf}" width="${bw}" height="${hf}" rx="2" fill="var(--gold)" fill-opacity="${cur ? .55 : .28}"><title>${mesLbl(s.k)}: faturamento ${brl(s.f)}</title></rect><rect x="${cx + 2}" y="${base - hl}" width="${bw}" height="${hl}" rx="2" fill="var(--accent)" fill-opacity="${cur ? 1 : .55}"><title>${mesLbl(s.k)}: lucro ${brl(s.l)}</title></rect><text x="${cx}" y="${base + 20}" text-anchor="middle" style="font-weight:${cur ? 600 : 400};fill:${cur ? 'var(--ink)' : 'var(--muted)'}">${mesLbl(s.k)}</text></g>`; }).join('');
  const topC = {}; vs.forEach(v => v.itens.forEach(i => { topC[i.sku] = (topC[i.sku] || 0) + i.qtd; }));
  const topL = Object.entries(topC).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topMax = Math.max(1, ...topL.map(x => x[1]));
  const df = P.f ? (fat - P.f) / P.f * 100 : null;
  const primeiroNome = (ctx.perfil.nome || '').split(' ')[0];
  let frase;
  if (!S.produtos.length) frase = 'Sua loja está pronta. Comece cadastrando as peças em <b>Produtos</b>; depois imprima as etiquetas e registre as vendas pelo <b>Leitor</b>.';
  else if (vs.length) frase = `Em ${mesLongo(m)} foram <b>${vs.length} venda${vs.length > 1 ? 's' : ''}</b> somando <b>${brl(fat)}</b>${df != null ? `, ${Math.abs(df) < 0.5 ? 'igual a' : df > 0 ? pct(df) + ' acima de' : pct(-df) + ' abaixo de'} ${MESES_L[Number(mesAnt(m).slice(5, 7)) - 1]}` : ''}. ${abaixo.length || baixos.length || parados.length ? 'Há pontos pedindo sua atenção logo abaixo.' : 'Estoque e preços estão em ordem.'}`;
  else frase = `Ainda não há vendas em ${mesLongo(m)}. Registre a primeira pelo <b>Leitor</b>.`;
  const pl = plano();
  return `
  <section class="hello"><span class="ring" aria-hidden="true"></span>
    <span class="eyebrow">${mesLongo(m)}</span>
    <h1>${saud()}${primeiroNome ? ', <em>' + esc(primeiroNome) + '</em>' : ''}</h1>
    <p>${frase}</p>
  </section>
  <div class="head"><div><span class="eyebrow">Resumo do mês</span><h2>Painel</h2></div>
    <div class="field"><label for="mes">Mês</label><select id="mes" class="inp" data-bind="mes">${ms.map(k => `<option value="${k}" ${k === m ? 'selected' : ''}>${mesLbl(k)}</option>`).join('')}</select></div></div>
  <div class="kpis">
    <div class="kpi"><div class="lbl">Faturamento</div><div class="val num">${brl(fat)}</div><div class="sub">${delta(fat, P.f)}<span>vs. mês anterior</span></div></div>
    <div class="kpi"><div class="lbl">Lucro estimado</div><div class="val num">${brl(luc)}</div><div class="sub">${delta(luc, P.l)}<span>margem ${pct(fat ? luc / fat * 100 : 0)}</span></div></div>
    <div class="kpi"><div class="lbl">Peças vendidas</div><div class="val num">${pecas}</div><div class="sub">ticket médio ${brl(vs.length ? fat / vs.length : 0)}</div></div>
    <div class="kpi"><div class="lbl">Estoque a custo</div><div class="val num">${brl(emEst)}</div><div class="sub">vale ${brl(emEstV)} à vista</div></div>
  </div>
  <div class="grid g2">
    <div class="card grid" style="align-content:start"><div class="head" style="align-items:center"><h3>Faturamento e lucro</h3><div class="legend"><span><i style="background:var(--gold);opacity:.5"></i>Faturamento</span><span><i style="background:var(--accent)"></i>Lucro</span></div></div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Faturamento e lucro por mês">${grid}${bars}</svg></div>
    <div class="card grid" style="align-content:start"><h3>Precisa de atenção</h3>
      ${abaixo.length ? `<div class="alert bad"><span><b>${abaixo.length} item${abaixo.length > 1 ? 's' : ''} vendido${abaixo.length > 1 ? 's' : ''} abaixo do preço calculado</b> em ${mesLbl(m)}. Deixou de ganhar ${brl(perda)}.</span></div>` : ''}
      ${baixos.length ? `<div class="alert warn"><span><b>Estoque baixo:</b> ${baixos.map(p => esc(p.nome) + ' (' + p.estoque + ')').join(', ')}.</span></div>` : ''}
      ${parados.length ? `<div class="alert warn"><span><b>Parados há mais de 45 dias:</b> ${parados.map(p => esc(p.nome) + ' (' + diasParado(S, p.sku) + ' dias)').join(', ')}.</span></div>` : ''}
      ${!abaixo.length && !baixos.length && !parados.length ? '<div class="alert good">Tudo em ordem.</div>' : ''}
      <div class="grid" style="gap:8px"><span class="eyebrow" style="margin-top:6px">Mais vendidos em ${mesLbl(m)}</span>
      ${topL.length ? topL.map(([sku, q]) => `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:center"><span class="pname">${esc(prod(S, sku)?.nome || sku)}</span><span class="num small">${q} un.</span><span style="grid-column:1/-1;height:3px;border-radius:2px;background:var(--surface-2);overflow:hidden"><span style="display:block;height:100%;width:${q / topMax * 100}%;background:linear-gradient(90deg,var(--gold),var(--accent))"></span></span></div>`).join('') : '<div class="small muted">Sem vendas no mês.</div>'}</div>
    </div>
  </div>
  <div class="foot small"><span class="muted">Plano ${esc(pl.nome)} · ${S.produtos.length}${pl.max_pecas ? ' de ' + pl.max_pecas : ''} peças cadastradas.</span><span class="muted">Dúvidas: WhatsApp (31) 97310-9443</span></div>`;
}

/* ---------- PRODUTOS ---------- */
function vProdutos() {
  if (ui.etiquetas) return vEtiquetas();
  const q = ui.q.trim().toLowerCase();
  let ps = S.produtos.filter(p => !q || (p.nome + ' ' + p.sku + ' ' + p.forn + ' ' + p.skuF + ' ' + p.cat).toLowerCase().includes(q));
  if (ui.filtro === 'baixo') ps = ps.filter(p => p.estoque <= p.min);
  if (ui.filtro === 'parado') ps = ps.filter(p => p.estoque > 0 && diasParado(S, p.sku) > 45);
  if (ui.filtro === 'abaixo') ps = ps.filter(p => p.preco != null && p.preco < calcVista(S, p) - 0.005);
  const F = [['todos', 'Todos'], ['baixo', 'Estoque baixo'], ['parado', 'Parados'], ['abaixo', 'Preço abaixo do calculado']];
  return `
  <div class="head"><div><span class="eyebrow">Coleção</span><h2>Produtos</h2><p class="muted">${S.produtos.length} peças cadastradas · rateio de insumos de ${brl(rateio(S))} por peça.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="etq-open" ${S.produtos.length ? '' : 'disabled'}>Etiquetas${ui.sel.length ? ' (' + ui.sel.length + ')' : ''}</button>${dona() ? '<button class="btn primary" data-act="novo">+ Nova peça</button>' : ''}</div></div>
  <div class="card grid">
    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><input id="busca" class="inp" style="max-width:320px" placeholder="Buscar por nome, código ou fornecedor" value="${esc(ui.q)}" data-bind="q">
      <div class="chips">${F.map(([k, l]) => `<button class="chip" data-act="filtro" data-k="${k}" aria-pressed="${ui.filtro === k}">${l}</button>`).join('')}</div></div>
    <div class="list">
      <div class="row prow headrow"><span></span><span>Peça</span><span class="r c-est">Estoque</span><span class="r c-custo">Custo total</span><span class="r c-calc">Preço calculado</span><span class="r c-preco">Preço praticado</span><span class="r c-marg">Margem</span></div>
      ${ps.length ? ps.map(p => { const e = p.estoque; const c = calcVista(S, p); const v = vistaPraticado(S, p); const mg = margem(S, p); const low = e <= p.min; const ab = p.preco != null && p.preco < c - 0.005;
        return `<div class="row prow" data-act="abrir" data-sku="${esc(p.sku)}">
          <span><input type="checkbox" class="cb" id="sel-${esc(p.sku)}" data-act="sel" data-sku="${esc(p.sku)}" ${ui.sel.includes(p.sku) ? 'checked' : ''} aria-label="Selecionar ${esc(p.nome)}"></span>
          <span style="min-width:0"><span class="pname">${esc(p.nome)}</span><span class="cellnote"><span class="mono">${esc(p.sku)}</span> · ${esc(p.cat || 'Sem categoria')} · ${esc(p.forn)}${diasParado(S, p.sku) > 45 && e > 0 ? ' · <span style="color:var(--warn)">parado ' + diasParado(S, p.sku) + ' dias</span>' : ''}</span></span>
          <span class="r c-est"><span class="pill ${e <= 0 ? 'bad' : low ? 'warn' : 'neutral'} num">${e} un.</span></span>
          <span class="r num c-custo">${brl(custoTotal(S, p))}</span>
          <span class="r num c-calc">${brl(c)}</span>
          <span class="r num c-preco">${brl(v)}${ab ? '<span class="cellnote" style="color:var(--bad)">abaixo do calculado</span>' : p.preco == null ? '<span class="cellnote">automático</span>' : ''}<span class="cellnote">cartão ${brl(cartaoDe(S, v))}</span></span>
          <span class="r c-marg"><span class="pill ${mg < 15 ? 'bad' : mg < 30 ? 'warn' : 'good'} num">${pct(mg)}</span></span>
        </div>`; }).join('') : `<div class="empty">${S.produtos.length ? 'Nenhuma peça com esse filtro.' : dona() ? 'Nenhuma peça cadastrada ainda. Use “+ Nova peça” para começar.' : 'A dona da loja ainda não cadastrou peças.'}</div>`}
    </div>
  </div>`;
}

/* ---------- ETIQUETAS ---------- */
function etiqueta(p, comPreco) {
  return `<div class="label"><div class="qr" data-qr="${esc(p.sku)}"></div><div style="min-width:0"><div class="lb">${esc(S.marca.nome)}</div><div class="ln">${esc(p.nome || 'Nome da peça')}</div><div class="ls">${esc(p.sku)}</div>${comPreco ? `<div class="lp num">${brl(vistaPraticado(S, p))} à vista<br>${brl(cartaoDe(S, vistaPraticado(S, p)))} em até 3x</div>` : ''}</div></div>`;
}
function vEtiquetas() {
  const ps = (ui.sel.length ? ui.sel.map(s => prod(S, s)).filter(Boolean) : S.produtos);
  const labels = []; ps.forEach(p => { const n = ui.copias[p.sku] != null ? ui.copias[p.sku] : 1; for (let i = 0; i < n; i++) labels.push(p); });
  const shown = labels.slice(0, 60);
  return `
  <div class="head"><div><span class="eyebrow">Produtos</span><h2>Etiquetas</h2><p class="muted">QR com o código da peça e o nome da sua loja. ${ui.sel.length ? ui.sel.length + ' peça(s) selecionada(s).' : 'Todas as peças.'}</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="etq-estoque">Uma por peça em estoque</button><button class="btn" data-act="etq-close">Voltar</button></div></div>
  <div class="card grid">
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Peça</th><th>Código</th><th>Cópias</th></tr></thead><tbody>
    ${ps.map(p => `<tr><td>${esc(p.nome)}</td><td class="mono">${esc(p.sku)}</td><td><input id="cop-${esc(p.sku)}" type="number" min="0" max="60" class="inp sm num" style="width:72px" value="${ui.copias[p.sku] != null ? ui.copias[p.sku] : 1}" data-bind="copia" data-sku="${esc(p.sku)}"></td></tr>`).join('')}
    </tbody></table></div>
    <div class="alert warn small"><span>Para imprimir, use o atalho Ctrl+P do navegador com folha A4 adesiva, ou envie para a impressora térmica.</span></div>
    <div class="sheet">${shown.map(p => etiqueta(p, true)).join('') || '<div class="empty">Nenhuma etiqueta.</div>'}</div>
    ${labels.length > 60 ? `<div class="hint">Mostrando 60 de ${labels.length} etiquetas.</div>` : ''}
  </div>`;
}
function drawQR(root) {
  root.querySelectorAll('[data-qr]').forEach(el => {
    if (el.dataset.done) return; el.dataset.done = '1';
    if (window.QRCode) { try { new QRCode(el, { text: el.dataset.qr, width: 160, height: 160, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M }); } catch (e) { el.textContent = el.dataset.qr; } }
    else el.innerHTML = '<span class="mono" style="font-size:.7rem;color:#000">' + esc(el.dataset.qr) + '</span>';
  });
}

/* ---------- LEITOR ---------- */
function vLeitor() {
  const M = [['entrada', 'Entrada'], ['venda', 'Venda'], ['conferencia', 'Conferência']];
  const desc = { entrada: 'Bipe as peças que chegaram do fornecedor. O estoque soma ao confirmar.', venda: 'Bipe as peças vendidas. O estoque baixa ao finalizar a venda.', conferencia: 'Bipe tudo o que está na vitrine e compare com o estoque do sistema.' };
  return `
  <div class="head"><div><span class="eyebrow">Balcão</span><h2>Leitor</h2><p class="muted">${desc[ui.mode]}</p></div>
    <div class="seg" role="group" aria-label="Modo">${M.map(([k, l]) => `<button data-act="mode" data-k="${k}" aria-pressed="${ui.mode === k}">${l}</button>`).join('')}</div></div>
  <div class="card grid">
    <div class="scanbox">
      <label class="camera" id="camzone">${ICONS.camera}<b>Fotografar código</b><span class="small muted">No celular, abre a câmera. Aponte para o QR da etiqueta.</span><input type="file" id="foto" accept="image/*" capture="environment" aria-label="Fotografar código"></label>
      <div class="grid" style="align-content:start">
        <div class="field"><label for="codigo">Digitar código ou usar leitor Bluetooth</label>
          <div style="display:flex;gap:8px"><input id="codigo" class="inp mono" placeholder="EO-0001 ou código do fornecedor" autocomplete="off"><button class="btn" data-act="bipar">Bipar</button></div>
          <span class="hint">O leitor Bluetooth digita o código e aperta Enter sozinho.</span></div>
      </div>
    </div>
  </div>
  ${ui.mode === 'venda' ? pVenda() : ui.mode === 'entrada' ? pEntrada() : pConf()}`;
}
function msgVenda(v, c) {
  const m = S.marca;
  return `Oi, ${c.nome.split(' ')[0]}! Obrigada por comprar na ${m.nome}. Itens: ${v.itens.map(i => i.qtd + 'x ' + (prod(S, i.sku)?.nome || i.sku)).join(', ')}. Total ${brl(v.total)}${v.pag === 'cartao' ? ' em ' + v.parc + 'x no cartão' : ' à vista'}.${m.insta ? ' Acompanhe as novidades em ' + m.insta + '.' : ''}`;
}
function pVenda() {
  if (ui.ultima) { const v = S.vendas.find(x => x.id === ui.ultima); const c = v && cli(S, v.cliente);
    if (v && c) return `<div class="card grid"><div class="alert good"><span><b>Venda #${v.id} registrada.</b> ${brl(v.total)} · lucro estimado ${brl(v.lucro)}. Estoque atualizado.</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${c.wa ? `<a class="btn primary" href="${wa(c.wa, msgVenda(v, c))}" target="_blank" rel="noopener">Enviar resumo no WhatsApp</a>` : ''}<button class="btn" data-act="nova-venda">Nova venda</button></div>
      ${c.wa ? `<div class="hint">WhatsApp de ${esc(c.nome)}: <span class="mono">${fone(c.wa)}</span></div>` : ''}</div>`; }
  const its = ui.cart.map(c => { const p = prod(S, c.sku); const calc = calcPara(S, p, ui.pag); const e = p.estoque; const l = lucroItem(S, c.preco, custoTotal(S, p), ui.pag) * c.qtd;
    return { c, p, calc, e, l, abaixo: c.preco < calc - 0.005, falta: c.qtd > e }; });
  const total = its.reduce((s, x) => s + x.c.preco * x.c.qtd, 0), lucro = its.reduce((s, x) => s + x.l, 0);
  const falta = its.some(x => x.falta); const abaixo = its.filter(x => x.abaixo);
  const temCli = ui.cliente === 'novo' ? ui.novoNome.trim().length > 1 : !!ui.cliente;
  return `<div class="grid g2">
  <div class="card"><h3 style="margin-bottom:10px">Itens da venda</h3>
    ${its.length ? its.map(x => `<div class="cart-item"><div style="min-width:0"><div class="pname">${esc(x.p.nome)}</div><div class="cellnote"><span class="mono">${esc(x.p.sku)}</span> · calculado ${brl(x.calc)} · ${x.e} em estoque</div>
      ${x.falta ? '<div class="cellnote" style="color:var(--bad)">Estoque insuficiente</div>' : ''}${x.abaixo ? `<div class="cellnote" style="color:var(--bad)">Abaixo do calculado: ${brl(x.calc - x.c.preco)} a menos por peça</div>` : ''}</div>
      <div class="qty"><button data-act="q-" data-sku="${esc(x.c.sku)}" aria-label="Menos">−</button><span class="num">${x.c.qtd}</span><button data-act="q+" data-sku="${esc(x.c.sku)}" aria-label="Mais">+</button></div>
      <input id="pr-${esc(x.c.sku)}" class="inp sm price-in num" inputmode="decimal" value="${x.c.preco.toFixed(2).replace('.', ',')}" data-bind="preco" data-sku="${esc(x.c.sku)}" aria-label="Preço unitário">
      <button class="btn ghost icon" data-act="rm" data-sku="${esc(x.c.sku)}" aria-label="Remover">✕</button></div>`).join('') : '<div class="empty">Bipe uma peça para começar.</div>'}
  </div>
  <div class="card grid" style="align-content:start">
    <div class="field"><span class="flabel">Pagamento</span><div class="seg"><button data-act="pag" data-k="vista" aria-pressed="${ui.pag === 'vista'}">À vista / Pix</button><button data-act="pag" data-k="cartao" aria-pressed="${ui.pag === 'cartao'}">Cartão</button></div></div>
    ${ui.pag === 'cartao' ? `<div class="field"><label for="parc">Parcelas</label><select id="parc" class="inp" data-bind="parc">${[1, 2, 3].map(n => `<option ${ui.parc === n ? 'selected' : ''} value="${n}">${n}x de ${brl(total / n)}</option>`).join('')}</select><span class="hint">Taxa da maquininha de ${pct(S.settings.taxaCartao)} já embutida no preço.</span></div>` : ''}
    <div class="field"><label for="cli">Cliente</label><select id="cli" class="inp" data-bind="cliente"><option value="">Escolha a cliente</option>${S.clientes.map(c => `<option value="${c.id}" ${String(ui.cliente) === String(c.id) ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}<option value="novo" ${ui.cliente === 'novo' ? 'selected' : ''}>+ Nova cliente</option></select></div>
    ${ui.cliente === 'novo' ? `<div class="grid g2"><div class="field"><label for="nn">Nome</label><input id="nn" class="inp" data-bind="novoNome" value="${esc(ui.novoNome)}" maxlength="80"></div><div class="field"><label for="nw">WhatsApp</label><input id="nw" class="inp" inputmode="tel" placeholder="31 90000-0000" data-bind="novoWa" value="${esc(ui.novoWa)}"></div></div>` : ''}
    <div class="totals"><div><span class="muted small">Total</span><span class="big num">${brl(total)}</span></div><div class="small"><span class="muted">Lucro estimado</span><span class="num" style="color:${lucro < 0 ? 'var(--bad)' : 'var(--good)'};font-weight:600">${brl(lucro)}</span></div></div>
    ${abaixo.length ? `<div class="alert bad small"><span>${abaixo.length} item(ns) abaixo do preço calculado. Ajuste o preço ou confirme o desconto.</span></div>` : ''}
    <button class="btn primary block" data-act="finalizar" ${!its.length || falta || !temCli || ui.ocupado ? 'disabled' : ''}>${ui.ocupado ? 'Registrando…' : 'Finalizar venda'}</button>
    ${its.length && !temCli ? '<span class="hint">Escolha a cliente para finalizar.</span>' : ''}
  </div></div>`;
}
function pEntrada() {
  const tot = ui.entrada.reduce((s, x) => s + x.qtd, 0);
  return `<div class="card grid"><h3>Entrada de mercadoria</h3>
    ${ui.entrada.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Peça</th><th>Estoque atual</th><th>Chegando</th><th>Fica com</th><th></th></tr></thead><tbody>
    ${ui.entrada.map(x => { const p = prod(S, x.sku); return `<tr><td>${esc(p.nome)} <span class="mono muted">${esc(p.sku)}</span></td><td class="num">${p.estoque}</td><td><div class="qty"><button data-act="e-" data-sku="${esc(x.sku)}" aria-label="Menos">−</button><span class="num">${x.qtd}</span><button data-act="e+" data-sku="${esc(x.sku)}" aria-label="Mais">+</button></div></td><td class="num"><b>${p.estoque + x.qtd}</b></td><td><button class="btn ghost icon" data-act="e-rm" data-sku="${esc(x.sku)}" aria-label="Remover">✕</button></td></tr>`; }).join('')}
    </tbody></table></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn primary" data-act="conf-entrada" ${ui.ocupado ? 'disabled' : ''}>Confirmar entrada de ${tot} peça${tot > 1 ? 's' : ''}</button><button class="btn ghost" data-act="limpa-entrada">Limpar</button></div>` : '<div class="empty">Bipe as peças que chegaram. Cada bipe soma 1.</div>'}
  </div>`;
}
function pConf() {
  const skus = Object.keys(ui.conf);
  const naoBip = S.produtos.filter(p => !ui.conf[p.sku] && p.estoque > 0);
  const difs = skus.map(s => ({ p: prod(S, s), cont: ui.conf[s] })).map(x => ({ ...x, esp: x.p.estoque, d: x.cont - x.p.estoque }));
  const nd = difs.filter(x => x.d !== 0).length;
  return `<div class="card grid"><h3>Conferência de estoque</h3>
    ${skus.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Peça</th><th>No sistema</th><th>Contado</th><th>Diferença</th></tr></thead><tbody>
    ${difs.map(x => `<tr><td>${esc(x.p.nome)} <span class="mono muted">${esc(x.p.sku)}</span></td><td class="num">${x.esp}</td><td class="num">${x.cont}</td><td>${x.d === 0 ? '<span class="pill good">confere</span>' : `<span class="pill ${x.d < 0 ? 'bad' : 'warn'} num">${x.d > 0 ? '+' : ''}${x.d}</span>`}</td></tr>`).join('')}
    </tbody></table></div>
    ${naoBip.length ? `<div class="alert warn small"><span><b>Ainda não bipadas:</b> ${naoBip.map(p => esc(p.nome) + ' (' + p.estoque + ' no sistema)').join(', ')}.</span></div>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-act="aplicar-conf" ${nd && !ui.ocupado ? '' : 'disabled'}>Ajustar ${nd} diferença${nd === 1 ? '' : 's'} no estoque</button><button class="btn ghost" data-act="limpa-conf">Recomeçar contagem</button></div>` : '<div class="empty">Bipe cada peça da vitrine. O sistema compara com o estoque.</div>'}
  </div>`;
}
function bipe(code) {
  code = String(code || '').trim().toUpperCase(); if (!code) return;
  const p = S.produtos.find(x => x.sku.toUpperCase() === code || (x.skuF && x.skuF.toUpperCase() === code));
  if (!p) { toast('Código ' + code + ' não está cadastrado', 'bad'); return; }
  if (ui.mode === 'venda') { ui.ultima = null; const c = ui.cart.find(x => x.sku === p.sku); if (c) c.qtd++; else ui.cart.push({ sku: p.sku, qtd: 1, preco: precoPara(S, p, ui.pag), manual: false }); }
  else if (ui.mode === 'entrada') { const c = ui.entrada.find(x => x.sku === p.sku); if (c) c.qtd++; else ui.entrada.push({ sku: p.sku, qtd: 1 }); }
  else ui.conf[p.sku] = (ui.conf[p.sku] || 0) + 1;
  toast(p.nome + ' +1'); render();
  const z = document.getElementById('camzone'); if (z) { z.classList.remove('flash'); void z.offsetWidth; z.classList.add('flash'); }
}
function lerFoto(file) {
  if (!file) return;
  if (!window.jsQR) { toast('Leitor de QR não carregou. Digite o código.', 'bad'); return; }
  const url = URL.createObjectURL(file); const img = new Image();
  img.onload = () => { const max = 1280; const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height); const r = jsQR(d.data, c.width, c.height, { inversionAttempts: 'attemptBoth' }); URL.revokeObjectURL(url);
    if (r && r.data) bipe(r.data); else toast('Não encontrei um QR na foto. Tente mais perto e com luz.', 'bad'); };
  img.onerror = () => { URL.revokeObjectURL(url); toast('Não consegui abrir a foto.', 'bad'); };
  img.src = url;
}

/* ---------- VENDAS ---------- */
function vVendas() {
  const ms = [...new Set(S.vendas.map(v => v.data.slice(0, 7)))].sort().reverse();
  const vs = S.vendas.filter(v => ui.vmes === 'todos' || v.data.startsWith(ui.vmes)).slice().sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
  const tot = vs.reduce((s, v) => s + v.total, 0), luc = vs.reduce((s, v) => s + v.lucro, 0);
  const porCli = S.clientes.map(c => { const xs = S.vendas.filter(v => v.cliente === c.id); return { c, n: xs.length, t: xs.reduce((s, v) => s + v.total, 0), u: xs.map(v => v.data).sort().at(-1) }; }).sort((a, b) => b.t - a.t);
  return `
  <div class="head"><div><span class="eyebrow">Histórico</span><h2>Vendas</h2><p class="muted">${vs.length} vendas · ${brl(tot)} · lucro estimado ${brl(luc)}</p></div>
    <div class="field"><label for="vmes">Período</label><select id="vmes" class="inp" data-bind="vmes"><option value="todos">Últimos 12 meses</option>${ms.map(k => `<option value="${k}" ${ui.vmes === k ? 'selected' : ''}>${mesLbl(k)}</option>`).join('')}</select></div></div>
  <div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th>#</th><th>Cliente</th><th>Itens</th><th>Pagamento</th><th class="r">Total</th><th class="r">Lucro</th></tr></thead><tbody>
    ${vs.map(v => { const ab = v.itens.some(i => i.preco < i.calc - 0.005); return `<tr><td class="num">${dmy(v.data)}</td><td class="num muted">${v.id}</td><td>${esc(cli(S, v.cliente)?.nome || '')}</td><td>${v.itens.map(i => i.qtd + '× ' + esc(prod(S, i.sku)?.nome || i.sku)).join('<br>')}${ab ? '<br><span class="pill bad">abaixo do calculado</span>' : ''}</td><td>${v.pag === 'cartao' ? 'Cartão ' + v.parc + 'x' : 'À vista'}</td><td class="r num">${brl(v.total)}</td><td class="r num" style="color:${v.lucro < 0 ? 'var(--bad)' : 'inherit'}">${brl(v.lucro)}</td></tr>`; }).join('') || '<tr><td colspan="7" class="empty">Nenhuma venda ainda.</td></tr>'}
  </tbody></table></div>
  <div class="card grid"><h3>Clientes</h3>
    ${porCli.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Compras</th><th class="r">Total gasto</th><th>Última compra</th><th></th></tr></thead><tbody>
    ${porCli.map(x => `<tr><td>${esc(x.c.nome)}</td><td class="mono">${fone(x.c.wa)}</td><td class="num">${x.n}</td><td class="r num">${brl(x.t)}</td><td class="num">${x.u ? dmy(x.u) : '—'}</td><td>${x.c.wa ? `<a class="btn sm" href="${wa(x.c.wa, 'Oi, ' + x.c.nome.split(' ')[0] + '! Chegaram peças novas na ' + S.marca.nome + ', quer ver?')}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</td></tr>`).join('')}
    </tbody></table></div>` : '<div class="empty">As clientes aparecem aqui depois da primeira venda.</div>'}
  </div>`;
}

/* ---------- HISTÓRICO ---------- */
const TAB_NOME = { lojas: 'Loja', membros: 'Equipe', convites: 'Convite', insumos: 'Insumo', produtos: 'Peça', clientes: 'Cliente', vendas: 'Venda', venda_itens: 'Item de venda', movimentos: 'Estoque' };
const CAMPO = { nome: 'nome', assinatura: 'assinatura', instagram: 'Instagram', paleta: 'paleta', plano: 'plano', ativa: 'ativa', markup: 'markup', taxa_cartao: 'taxa do cartão', imposto: 'imposto', arredondar: 'arredondar em ,90',
  tipo: 'tipo', total: 'total', qtd: 'quantidade', sku: 'código', categoria: 'categoria', fornecedor: 'fornecedor', sku_fornecedor: 'código do fornecedor', custo: 'custo', preco: 'preço', estoque_minimo: 'estoque mínimo', ativo: 'ativa',
  whatsapp: 'WhatsApp', papel: 'papel', email: 'e-mail', pagamento: 'pagamento', parcelas: 'parcelas', lucro: 'lucro', ref: 'motivo' };
const IGNORA = ['id', 'loja_id', 'criado_em', 'usuario', 'criado_por', 'dona', 'venda_id', 'user_id'];
function fmtValor(k, v) {
  if (v == null || v === '') return '—';
  if (['custo', 'preco', 'total', 'lucro'].includes(k)) return brl(v);
  if (['taxa_cartao', 'imposto'].includes(k)) return pct(v);
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  if (k === 'paleta') return (PALETAS[v] || {}).nome || v;
  return String(v);
}
function descreve(a) {
  const r = a.depois || a.antes || {};
  const nomeReg = r.nome || r.email || (a.tabela === 'vendas' ? 'Venda #' + r.numero : '') ||
    (a.tabela === 'movimentos' ? `${(prodId(S, r.produto_id) || {}).nome || 'peça #' + r.produto_id}: ${r.qtd > 0 ? '+' : ''}${r.qtd} (${r.ref || r.tipo})` : '') ||
    (a.tabela === 'venda_itens' ? `${r.qtd}× ${(prodId(S, r.produto_id) || {}).nome || 'peça #' + r.produto_id} a ${brl(r.preco)}` : '') || ('#' + (a.registro || ''));
  const verbo = { INSERT: 'criou', UPDATE: 'alterou', DELETE: 'excluiu' }[a.acao];
  let diff = '';
  if (a.acao === 'UPDATE' && a.antes && a.depois) {
    diff = Object.keys(a.depois).filter(k => !IGNORA.includes(k) && JSON.stringify(a.antes[k]) !== JSON.stringify(a.depois[k]))
      .map(k => `${esc(CAMPO[k] || k)}: <s>${esc(fmtValor(k, a.antes[k]))}</s> → <ins>${esc(fmtValor(k, a.depois[k]))}</ins>`).join(' · ');
  }
  return { titulo: `<b>${esc(a.email || 'sistema')}</b> ${verbo} ${esc((TAB_NOME[a.tabela] || a.tabela).toLowerCase())} <b>${esc(nomeReg)}</b>`, diff };
}
async function carregarHistorico(mais) {
  const h = ui.hist; const N = 50;
  try {
    let q = sb().from('auditoria').select('*').eq('loja_id', ctx.lojaId).order('em', { ascending: false }).range(h.pag * N, h.pag * N + N - 1);
    if (h.tabela !== 'todas') q = q.eq('tabela', h.tabela);
    const r = await q; if (r.error) throw r.error;
    h.itens = (mais ? (h.itens || []) : []).concat(r.data); h.fim = r.data.length < N;
    if (ui.tab === 'historico') render();
  } catch (e) { h.itens = []; falha(e); }
}
function vHistorico() {
  const h = ui.hist;
  const F = [['todas', 'Tudo'], ['produtos', 'Peças'], ['vendas', 'Vendas'], ['movimentos', 'Estoque'], ['lojas', 'Loja e preços'], ['insumos', 'Insumos'], ['membros', 'Equipe'], ['clientes', 'Clientes']];
  return `
  <div class="head"><div><span class="eyebrow">Segurança</span><h2>Histórico de alterações</h2><p class="muted">Tudo o que foi criado, alterado ou excluído na loja, com quem fez e quando. Este registro não pode ser editado.</p></div></div>
  <div class="card grid">
    <div class="chips">${F.map(([k, l]) => `<button class="chip" data-act="hist-filtro" data-k="${k}" aria-pressed="${h.tabela === k}">${l}</button>`).join('')}</div>
    <div class="list">${h.itens === null ? '<div class="empty">Carregando…</div>' : h.itens.length ? h.itens.map(a => { const d = descreve(a); return `<div class="hist-item"><div class="hist-when num">${dataHora(a.em)}</div><div class="hist-what"><span>${d.titulo}</span>${d.diff ? `<span class="diff">${d.diff}</span>` : ''}</div></div>`; }).join('') : '<div class="empty">Nenhuma alteração registrada.</div>'}</div>
    ${h.itens && !h.fim ? '<div><button class="btn" data-act="hist-mais">Ver mais antigas</button></div>' : ''}
  </div>`;
}

/* ---------- AJUSTES ---------- */
async function carregarEquipe() {
  ui.equipe = { membros: [], convites: [], carregando: true };
  try {
    const [m, c] = await Promise.all([
      sb().from('membros').select('*').eq('loja_id', ctx.lojaId),
      sb().from('convites').select('*').eq('loja_id', ctx.lojaId).order('criado_em')
    ]);
    if (m.error) throw m.error;
    const ids = m.data.map(x => x.user_id);
    const p = ids.length ? await sb().from('perfis').select('id,nome,email').in('id', ids) : { data: [] };
    const perf = {}; (p.data || []).forEach(x => perf[x.id] = x);
    ui.equipe = { membros: m.data.map(x => ({ ...x, nome: perf[x.user_id]?.nome || '', email: perf[x.user_id]?.email || '' })), convites: c.data || [] };
  } catch (e) { ui.equipe = { membros: [], convites: [] }; falha(e); }
  if (ui.tab === 'ajustes') render();
}
const AJ_SECOES = [
  ['marca', 'Marca da loja', 'Nome, assinatura e cores'],
  ['equipe', 'Equipe', 'Quem usa e o que pode fazer'],
  ['precos', 'Preços e insumos', 'Markup, taxas e embalagens'],
  ['plano', 'Plano e lojas', 'Limites e outras lojas'],
  ['conta', 'Minha conta', 'Nome, senha e segurança']
];
const AJ_ICON = {
  marca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 9-9c0 2.5-2 3-3.5 3H15a2 2 0 0 0-1.5 3.3A1.7 1.7 0 0 1 12 21z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/></svg>',
  equipe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
  precos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
  plano: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l4 3 5-7 5 7 4-3-2 11H5z"/></svg>',
  conta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'
};
const ajTitulo = (t, d, extra) => `<div class="aj-titulo"><div><h3>${t}</h3>${d ? `<p class="muted small">${d}</p>` : ''}</div>${extra || ''}</div>`;
const WA_PLANO = 'https://wa.me/5531973109443?text=' + encodeURIComponent('Olá! Quero mudar o plano da minha loja no EstoqueOn.');

function vEquipe() {
  const e = ui.equipe || { membros: [], convites: [], carregando: true };
  const pl = plano(); const usadas = e.membros.length + e.convites.length;
  return `<div class="card grid">${ajTitulo('Quem usa a loja', `${usadas} de ${pl.max_usuarias} usuária${pl.max_usuarias === 1 ? '' : 's'} do plano ${esc(pl.nome)}.`)}
    ${e.carregando ? '<div class="empty">Carregando…</div>' : `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pessoa</th><th>Papel</th><th></th></tr></thead><tbody>
    ${e.membros.map(m => `<tr><td>${esc(m.nome || m.email)}<span class="cellnote">${esc(m.email)}</span></td><td>${m.user_id === ctx.user.id ? '<span class="pill accent">Você · ' + (m.papel === 'dona' ? 'dona' : 'vendedora') + '</span>' : `<select id="papel-${m.user_id}" class="inp sm" data-bind="papel" data-uid="${m.user_id}"><option value="vendedora" ${m.papel === 'vendedora' ? 'selected' : ''}>Vendedora</option><option value="dona" ${m.papel === 'dona' ? 'selected' : ''}>Dona</option></select>`}</td><td class="r">${m.user_id === ctx.user.id ? '' : `<button class="btn sm danger" data-act="membro-rm" data-uid="${m.user_id}">Remover</button>`}</td></tr>`).join('')}
    ${e.convites.map(c => `<tr><td>${esc(c.email)}<span class="cellnote">Convite pendente: ela precisa criar a conta com este e-mail</span></td><td>${c.papel === 'dona' ? 'Dona' : 'Vendedora'}</td><td class="r"><button class="btn sm" data-act="convite-rm" data-id="${c.id}">Cancelar</button></td></tr>`).join('')}
    </tbody></table></div>`}
  </div>
  ${e.carregando ? '' : usadas < pl.max_usuarias ? `<div class="card grid">${ajTitulo('Convidar pessoa', 'Ela recebe acesso quando criar a conta com o mesmo e-mail.')}
    <form class="grid g3" id="form-convite" style="align-items:end"><div class="field"><label for="cv-email">E-mail da pessoa</label><input id="cv-email" class="inp" type="email" autocomplete="off" required></div><div class="field"><label for="cv-papel">Papel</label><select id="cv-papel" class="inp"><option value="vendedora">Vendedora</option><option value="dona">Dona</option></select></div><button class="btn primary" type="submit">Convidar</button></form>
    <span class="hint">Depois de convidar, envie o endereço <span class="mono">${esc(EO.base())}cadastro.html</span> para ela.</span></div>`
    : `<div class="alert warn small"><span>O plano ${esc(pl.nome)} chegou ao limite de usuárias. <a href="${WA_PLANO}" target="_blank" rel="noopener">Fale com a gente para ampliar</a>.</span></div>`}
  <div class="card grid">${ajTitulo('O que cada papel pode fazer', '')}
    <div class="grid g2">
      <div class="papel"><b>Dona</b><ul><li>Tudo o que a vendedora faz</li><li>Muda preços, insumos e a marca</li><li>Convida e remove pessoas</li><li>Vê o histórico de alterações</li><li>Importa nota fiscal e envia fotos</li></ul></div>
      <div class="papel"><b>Vendedora</b><ul><li>Registra vendas pelo leitor</li><li>Dá entrada e saída no estoque</li><li>Faz a conferência da vitrine</li><li>Lança no caixa e cuida do pós-venda</li></ul></div>
    </div></div>`;
}
function vMarca() {
  const m = S.marca; const demo = S.produtos[0] || { sku: 'EO-0001', nome: 'Colar ponto de luz', custo: 18, preco: null };
  return `<div class="card grid">${ajTitulo('Identidade da loja', 'O nome aparece no topo, nas etiquetas e nas mensagens de WhatsApp. As alterações são salvas sozinhas.')}
    <div class="grid g2" style="align-items:start">
      <div class="grid">
        <div class="field"><label for="mk-nome">Nome da loja</label><input id="mk-nome" class="inp" value="${esc(m.nome)}" data-bind="marca" data-k="nome" maxlength="60"></div>
        <div class="field"><label for="mk-ass">Assinatura</label><input id="mk-ass" class="inp" value="${esc(m.assinatura)}" data-bind="marca" data-k="assinatura" maxlength="80" placeholder="Semijoias com banho de ouro 18k"></div>
        <div class="field"><label for="mk-ig">Instagram</label><input id="mk-ig" class="inp" value="${esc(m.insta)}" data-bind="marca" data-k="insta" maxlength="40" placeholder="@sualoja"></div>
      </div>
      <div class="grid" style="align-content:start"><span class="flabel">Como fica a etiqueta</span><div class="sheet" style="grid-template-columns:1fr">${etiqueta(demo, true)}</div></div>
    </div></div>
  <div class="card grid">${ajTitulo('Cores do sistema', 'A paleta vale para o sistema, o app de celular e as etiquetas.')}
    <div class="palettes">${Object.entries(PALETAS).map(([k, p]) => `<button class="pal" data-act="paleta" data-k="${k}" aria-pressed="${m.paleta === k}"><span class="sw">${p.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span><span><b>${p.nome}</b><span class="cellnote">${p.desc}</span></span></button>`).join('')}</div></div>`;
}
function vPrecos() {
  const st = S.settings; const r = rateio(S);
  const simC = numIn(ui.simCusto != null ? ui.simCusto : 10); const fake = { custo: simC, preco: null };
  const sv = calcVista(S, fake), sc = cartaoDe(S, sv), sl = lucroItem(S, sv, custoTotal(S, fake), 'vista');
  return `<div class="grid g2" style="align-items:start">
    <div class="card grid">${ajTitulo('Regras de preço', 'Mude uma regra e todos os preços calculados se atualizam.')}
      <div class="grid g2">
        <div class="field"><label for="mk">Markup</label><input id="mk" class="inp num" inputmode="decimal" value="${String(st.markup).replace('.', ',')}" data-bind="set" data-k="markup"><span class="hint">Multiplica o custo total.</span></div>
        <div class="field"><label for="tx">Taxa do cartão (%)</label><input id="tx" class="inp num" inputmode="decimal" value="${String(st.taxaCartao).replace('.', ',')}" data-bind="set" data-k="taxaCartao"><span class="hint">Embutida no preço do cartão.</span></div>
        <div class="field"><label for="im">Imposto sobre a venda (%)</label><input id="im" class="inp num" inputmode="decimal" value="${String(st.imposto).replace('.', ',')}" data-bind="set" data-k="imposto"><span class="hint">MEI com DAS fixo: deixe 0.</span></div>
        <div class="field"><span class="flabel">Arredondamento</span><label class="opcao"><input type="checkbox" class="cb" id="arr" data-bind="arred" ${st.arredondar ? 'checked' : ''}> Terminar em ,90</label></div>
      </div></div>
    <div class="card grid">${ajTitulo('Simulação', 'Veja como fica o preço de uma peça.')}
      <div class="breakdown">
        <div class="field" style="max-width:200px"><label for="sim">Custo no fornecedor</label><input id="sim" class="inp num" inputmode="decimal" value="${esc(ui.simCusto != null ? ui.simCusto : '10')}" data-bind="sim"></div>
        <div><span>Custo da peça</span><span class="num">${brl(simC)}</span></div>
        <div><span>+ Insumos por peça</span><span class="num">${brl(r)}</span></div>
        <div><span>= Custo total</span><span class="num">${brl(simC + r)}</span></div>
        <div><span>× Markup ${String(st.markup).replace('.', ',')}${st.imposto ? ' ÷ imposto' : ''}</span><span></span></div>
        <div class="sep"><b>Preço à vista</b><b class="num">${brl(sv)}</b></div>
        <div><b>Preço no cartão</b><b class="num">${brl(sc)}</b></div>
        <div><span>Lucro à vista</span><span class="num" style="color:var(--good)">${brl(sl)} (${pct(sv ? sl / sv * 100 : 0)})</span></div>
      </div></div>
  </div>
  <div class="card grid">${ajTitulo('Insumos por peça', 'Embalagens e impressos que vão com cada venda. O custo do lote dividido pela quantidade entra no custo de cada peça.', '<button class="btn sm" data-act="ins-add">+ Insumo</button>')}
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Insumo</th><th>Tipo</th><th>Lote (R$)</th><th>Qtd</th><th class="r">Por peça</th><th></th></tr></thead><tbody>
    ${S.insumos.map(i => `<tr><td><input id="in-n-${i.id}" class="inp sm" style="width:100%;min-width:120px" value="${esc(i.nome)}" data-bind="ins" data-id="${i.id}" data-k="nome" maxlength="60"></td>
      <td><select id="in-t-${i.id}" class="inp sm" data-bind="ins" data-id="${i.id}" data-k="tipo">${['Embalagem', 'Impressão', 'Outros'].map(t => `<option ${i.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
      <td><input id="in-v-${i.id}" class="inp sm num" style="width:80px" inputmode="decimal" value="${String(i.total).replace('.', ',')}" data-bind="ins" data-id="${i.id}" data-k="total"></td>
      <td><input id="in-q-${i.id}" class="inp sm num" style="width:64px" inputmode="numeric" value="${i.qtd}" data-bind="ins" data-id="${i.id}" data-k="qtd"></td>
      <td class="r num">${brl(i.qtd > 0 ? i.total / i.qtd : 0)}</td>
      <td><button class="btn ghost icon" data-act="ins-rm" data-id="${i.id}" aria-label="Remover ${esc(i.nome)}">✕</button></td></tr>`).join('')}
    </tbody></table></div>
    <div class="totals"><div><b>Rateio total por peça</b><b class="num">${brl(r)}</b></div></div></div>`;
}
function uso(rotulo, usado, max) {
  const p = max ? Math.min(100, usado / max * 100) : 8;
  return `<div class="uso"><div class="secao-linha"><span>${rotulo}</span><span class="num">${usado}${max ? ' de ' + max : ' · ilimitado'}</span></div><div class="barra"><span style="width:${p}%;${max && usado >= max ? 'background:var(--warn)' : ''}"></span></div></div>`;
}
function vPlano() {
  const pl = plano(); const minhas = ctx.lojas.filter(x => x.loja.dona === ctx.user.id);
  const e = ui.equipe || { membros: [], convites: [] };
  return `<div class="card grid">${ajTitulo('Plano ' + esc(pl.nome), brl(pl.preco_mensal) + ' por mês', `<a class="btn sm" href="${WA_PLANO}" target="_blank" rel="noopener">Mudar de plano</a>`)}
    ${uso('Peças cadastradas', S.produtos.length, pl.max_pecas)}
    ${uso('Usuárias nesta loja', e.membros.length + e.convites.length, pl.max_usuarias)}
    ${uso('Lojas', minhas.length, pl.max_lojas)}</div>
  <div class="card grid">${ajTitulo('Comparar planos', '')}
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Plano</th><th class="c">Mensal</th><th class="c">Peças</th><th class="c">Usuárias</th><th class="c">Lojas</th></tr></thead><tbody>
    ${ctx.planos.map(p => `<tr><td>${esc(p.nome)} ${p.id === S.loja.plano ? '<span class="pill accent">atual</span>' : ''}</td><td class="c num">${brl(p.preco_mensal)}</td><td class="c num">${p.max_pecas || 'ilimitadas'}</td><td class="c num">${p.max_usuarias}</td><td class="c num">${p.max_lojas}</td></tr>`).join('')}
    </tbody></table></div></div>
  <div class="card grid">${ajTitulo('Suas lojas', pl.max_lojas > 1 ? 'Cada loja tem marca, estoque, equipe e caixa próprios.' : 'O plano Gold permite até 3 lojas.')}
    <div class="tbl-wrap"><table class="tbl"><tbody>${minhas.map(x => `<tr><td>${esc(x.loja.nome)}</td><td class="r">${x.loja.id === ctx.lojaId ? '<span class="pill accent">aberta</span>' : `<button class="btn sm" data-act="abrir-loja" data-id="${x.loja.id}">Abrir</button>`}</td></tr>`).join('')}</tbody></table></div>
    ${pl.max_lojas > 1 && minhas.length < pl.max_lojas ? `<form id="form-loja" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end"><div class="field" style="flex:1 1 220px"><label for="nova-loja">Nova loja</label><input id="nova-loja" class="inp" maxlength="60" placeholder="Nome da nova loja" required></div><button class="btn" type="submit">Criar loja</button></form>` : ''}</div>`;
}
function vConta() {
  let vence = '';
  try { const l = Number(localStorage.getItem('eo-login-em')); if (l) vence = new Date(l + EO.PRAZO.maxHoras * 3600e3).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) {}
  const inat = EO.PRAZO.inatividadeMin % 60 ? EO.PRAZO.inatividadeMin + ' minutos' : (EO.PRAZO.inatividadeMin / 60 === 1 ? '1 hora' : EO.PRAZO.inatividadeMin / 60 + ' horas');
  return `<div class="card grid">${ajTitulo('Seus dados', '')}
    <form id="form-nome" class="grid g2" style="align-items:end"><div class="field"><label for="ct-nome">Seu nome</label><input id="ct-nome" class="inp" value="${esc(ctx.perfil.nome)}" maxlength="80"></div><div class="field"><span class="flabel">E-mail</span><div class="inp" style="background:var(--surface-2)">${esc(ctx.user.email)}</div></div><button class="btn" type="submit" style="justify-self:start">Salvar nome</button></form></div>
  <div class="card grid">${ajTitulo('Senha', 'Use uma senha que você não usa em outros sites.')}
    <form id="form-senha" class="grid" style="max-width:420px"><div class="field"><label for="ct-senha">Nova senha</label><div class="pass-wrap"><input id="ct-senha" class="inp" type="password" autocomplete="new-password"><button type="button">Mostrar</button></div><div class="meter"><span id="ct-barra"></span></div><ul class="rules" id="ct-regras"></ul></div><button class="btn" type="submit" style="justify-self:start">Trocar senha</button></form></div>
  <div class="card grid">${ajTitulo('Segurança', '')}
    <div class="kv-lista">
      <div><span>Login atual vence</span><b>${vence || 'em até ' + EO.PRAZO.maxHoras + ' horas'}</b></div>
      <div><span>Sai sozinho depois de</span><b>${inat} sem uso</b></div>
      <div><span>Papel nesta loja</span><b>${dona() ? 'Dona' : 'Vendedora'}</b></div>
    </div>
    <div class="acoes"><button class="btn" data-act="sair">Sair deste aparelho</button><button class="btn danger" data-act="sair-tudo">Sair de todos os aparelhos</button></div>
    <span class="hint">"Sair de todos os aparelhos" encerra o login no celular, no computador e em qualquer outro lugar. Use se perder o celular ou desconfiar que alguém tem a sua senha.</span></div>`;
}
function vAjustes() {
  const secs = dona() ? AJ_SECOES : AJ_SECOES.filter(s => s[0] === 'conta');
  if (!secs.some(s => s[0] === ui.aj)) ui.aj = secs[0][0];
  const atual = secs.find(s => s[0] === ui.aj);
  const corpo = { marca: vMarca, equipe: vEquipe, precos: vPrecos, plano: vPlano, conta: vConta }[ui.aj]();
  return `
  <div class="head"><div><span class="eyebrow">Configuração</span><h2>Ajustes</h2></div></div>
  <div class="aj">
    ${secs.length > 1 ? `<nav class="aj-nav" aria-label="Seções de ajustes">${secs.map(([k, t, d]) => `<button data-act="aj" data-k="${k}" ${ui.aj === k ? 'aria-current="page"' : ''}>${AJ_ICON[k]}<span><b>${t}</b><small>${d}</small></span></button>`).join('')}</nav>` : ''}
    <section class="aj-corpo" aria-label="${atual[1]}"><div class="aj-cab"><h2>${atual[1]}</h2><p class="muted">${atual[2]}</p></div>${corpo}</section>
  </div>`;
}

/* ---------- salvamento com espera (campos digitados) ---------- */
const timers = {};
function depois(chave, fn, ms) { clearTimeout(timers[chave]); timers[chave] = setTimeout(fn, ms || 700); }
async function salvarLoja(patch) {
  const r = await sb().from('lojas').update(patch).eq('id', ctx.lojaId);
  if (r.error) { falha(r.error); await recarregar(); }
}
async function salvarInsumo(i) {
  const r = await sb().from('insumos').update({ nome: i.nome || 'Insumo', tipo: i.tipo, total: i.total, qtd: i.qtd }).eq('id', i.id);
  if (r.error) falha(r.error);
}

/* ---------- modal de peça ---------- */
let draft = null;
function proximoSku() {
  const n = S.produtos.reduce((m, x) => { const k = parseInt(String(x.sku).replace(/\D/g, ''), 10); return isFinite(k) ? Math.max(m, k) : m; }, 0) + 1;
  return 'EO-' + String(n).padStart(4, '0');
}
function abrirProduto(sku) {
  const p = sku ? prod(S, sku) : null;
  draft = p ? { ...p, novo: false, inicial: 0 } : { sku: proximoSku(), nome: '', cat: '', forn: '', skuF: '', custo: 0, preco: null, min: 2, novo: true, inicial: 0, estoque: 0 };
  renderDlg(); document.getElementById('dlg').showModal();
}
function dlgPreview() {
  const d = draft; const c = calcVista(S, d); const v = d.preco != null ? d.preco : c; const ct = custoTotal(S, d); const l = lucroItem(S, v, ct, 'vista'); const vc = cartaoDe(S, v); const lc = lucroItem(S, vc, ct, 'cartao');
  return `<div><span>Custo no fornecedor</span><span class="num">${brl(d.custo)}</span></div>
    <div><span>+ Insumos por peça</span><span class="num">${brl(rateio(S))}</span></div>
    <div><span>= Custo total</span><span class="num">${brl(ct)}</span></div>
    <div class="sep"><span>Preço calculado à vista</span><span class="num">${brl(c)}</span></div>
    ${d.preco != null ? `<div><b>Preço praticado</b><b class="num" style="color:${d.preco < c - 0.005 ? 'var(--bad)' : 'inherit'}">${brl(d.preco)}</b></div>` : ''}
    <div><span>Preço no cartão (até 3x)</span><span class="num">${brl(vc)}</span></div>
    <div class="sep"><span>Lucro à vista</span><span class="num" style="color:${l < 0 ? 'var(--bad)' : 'var(--good)'}">${brl(l)} (${pct(v ? l / v * 100 : 0)})</span></div>
    <div><span>Lucro no cartão</span><span class="num" style="color:${lc < 0 ? 'var(--bad)' : 'var(--good)'}">${brl(lc)}</span></div>`;
}
async function renderDlg() {
  const d = draft; const ro = !dona() ? 'disabled' : '';
  const dlg = document.getElementById('dlg');
  dlg.innerHTML = `
  <div class="dlg-head"><div style="flex:1;min-width:0"><span class="eyebrow">${d.novo ? 'Cadastro' : 'Peça'}</span><h3>${d.novo ? 'Nova peça' : esc(d.nome)}</h3><span class="mono muted">${esc(d.sku)}${d.novo ? '' : ' · ' + d.estoque + ' em estoque'}</span></div><button class="btn ghost icon" data-act="dlg-close" aria-label="Fechar">✕</button></div>
  <div class="dlg-body">
    <div class="grid g2">
      <div class="field"><label for="d-nome">Nome</label><input id="d-nome" class="inp" value="${esc(d.nome)}" data-dbind="nome" maxlength="80" ${ro}></div>
      <div class="field"><label for="d-cat">Categoria</label><input id="d-cat" class="inp" value="${esc(d.cat)}" data-dbind="cat" placeholder="Brincos, Colares…" maxlength="40" ${ro}></div>
      <div class="field"><label for="d-forn">Fornecedor</label><input id="d-forn" class="inp" value="${esc(d.forn)}" data-dbind="forn" maxlength="60" ${ro}></div>
      <div class="field"><label for="d-skuf">Código do fornecedor</label><input id="d-skuf" class="inp mono" value="${esc(d.skuF)}" data-dbind="skuF" placeholder="opcional" maxlength="40" ${ro}></div>
      <div class="field"><label for="d-custo">Custo no fornecedor (R$)</label><input id="d-custo" class="inp num" inputmode="decimal" value="${String(d.custo).replace('.', ',')}" data-dbind="custo" ${ro}></div>
      <div class="field"><label for="d-preco">Preço à vista praticado (R$)</label><input id="d-preco" class="inp num" inputmode="decimal" value="${d.preco != null ? String(d.preco).replace('.', ',') : ''}" data-dbind="preco" placeholder="vazio = usar o calculado" ${ro}></div>
      <div class="field"><label for="d-min">Avisar quando o estoque chegar a</label><input id="d-min" class="inp num" inputmode="numeric" value="${d.min}" data-dbind="min" ${ro}></div>
      ${d.novo ? `<div class="field"><label for="d-ini">Estoque inicial</label><input id="d-ini" class="inp num" inputmode="numeric" value="${d.inicial}" data-dbind="inicial"></div>` : ''}
    </div>
    <div class="grid g2" style="align-items:start">
      <div class="breakdown" id="dlg-prev">${dlgPreview()}</div>
      <div class="grid" style="justify-items:center;gap:6px"><div class="sheet" style="grid-template-columns:1fr;width:100%">${etiqueta(d, false)}</div><span class="hint">Etiqueta com o QR desta peça.</span></div>
    </div>
    <div id="dlg-movs"></div>
  </div>
  <div class="dlg-foot">${!d.novo && dona() ? '<button class="btn danger" data-act="dlg-arquivar" style="margin-right:auto">Arquivar peça</button>' : ''}<button class="btn" data-act="dlg-close">${dona() ? 'Cancelar' : 'Fechar'}</button>${dona() ? `<button class="btn primary" data-act="dlg-save">${d.novo ? 'Cadastrar peça' : 'Salvar'}</button>` : ''}</div>`;
  drawQR(dlg);
  if (!d.novo) {
    const r = await sb().from('movimentos').select('*').eq('produto_id', d.id).order('criado_em', { ascending: false }).limit(10);
    const box = document.getElementById('dlg-movs');
    if (box && r.data && r.data.length) box.innerHTML = `<h3 style="margin-bottom:6px">Movimentações</h3><div class="tbl-wrap"><table class="tbl"><tbody>${r.data.map(m => `<tr><td class="num">${dmy(m.data)}</td><td>${m.tipo === 'entrada' ? 'Entrada' : m.tipo === 'venda' ? 'Venda' : 'Ajuste'}</td><td class="muted">${esc(m.ref)}</td><td class="r num" style="color:${m.qtd < 0 ? 'var(--bad)' : 'var(--good)'}">${m.qtd > 0 ? '+' : ''}${m.qtd}</td></tr>`).join('')}</tbody></table></div>`;
  }
}

/* ---------- ações ---------- */
async function ocupado(fn) { if (ui.ocupado) return; ui.ocupado = true; render(); try { await fn(); } catch (e) { falha(e); } ui.ocupado = false; render(); }
const A = {
  tab: b => { ui.tab = b.dataset.k; ui.etiquetas = false; try { localStorage.setItem('eo-tab', ui.tab); } catch (e) {} if (ui.tab === 'historico') ui.hist.itens = null; render(); window.scrollTo(0, 0); },
  sair: () => EO.sair(),
  'sair-tudo': async b => {
    if (b.dataset.confirma !== '1') { b.dataset.confirma = '1'; b.textContent = 'Confirmar: sair de todos'; return; }
    try { await sb().auth.signOut({ scope: 'global' }); } catch (e) {}
    try { localStorage.removeItem('eo-login-em'); localStorage.removeItem('eo-ativo-em'); } catch (e) {}
    location.replace('entrar.html');
  },
  filtro: b => { ui.filtro = b.dataset.k; render(); },
  abrir: (b, e) => { if (e.target.closest('input')) return; abrirProduto(b.dataset.sku); },
  sel: (b, e) => { e.stopPropagation(); const s = b.dataset.sku; ui.sel = ui.sel.includes(s) ? ui.sel.filter(x => x !== s) : [...ui.sel, s]; render(); },
  novo: () => abrirProduto(null),
  'etq-open': () => { ui.etiquetas = true; render(); }, 'etq-close': () => { ui.etiquetas = false; render(); },
  'etq-estoque': () => { (ui.sel.length ? ui.sel : S.produtos.map(p => p.sku)).forEach(s => ui.copias[s] = Math.max(0, estoque(S, s))); render(); },
  mode: b => { ui.mode = b.dataset.k; render(); },
  paleta: b => { S.marca.paleta = b.dataset.k; render(); salvarLoja({ paleta: b.dataset.k }); toast('Paleta ' + PALETAS[b.dataset.k].nome + ' aplicada'); },
  bipar: () => { const i = document.getElementById('codigo'); bipe(i.value); const j = document.getElementById('codigo'); if (j) { j.value = ''; j.focus(); } },
  'q+': b => { const c = ui.cart.find(x => x.sku === b.dataset.sku); c.qtd++; render(); },
  'q-': b => { const c = ui.cart.find(x => x.sku === b.dataset.sku); c.qtd--; if (c.qtd <= 0) ui.cart = ui.cart.filter(x => x !== c); render(); },
  rm: b => { ui.cart = ui.cart.filter(x => x.sku !== b.dataset.sku); render(); },
  pag: b => { ui.pag = b.dataset.k; if (ui.pag === 'vista') ui.parc = 1; ui.cart.forEach(c => { if (!c.manual) c.preco = precoPara(S, prod(S, c.sku), ui.pag); }); render(); },
  finalizar: () => ocupado(async () => {
    const novo = ui.cliente === 'novo';
    const r = await sb().rpc('registrar_venda', {
      p_loja: ctx.lojaId, p_cliente_id: novo ? null : Number(ui.cliente),
      p_cliente_nome: novo ? ui.novoNome.trim() : null, p_cliente_whatsapp: novo ? ui.novoWa : null,
      p_pagamento: ui.pag, p_parcelas: ui.pag === 'cartao' ? ui.parc : 1,
      p_itens: ui.cart.map(c => ({ produto_id: prod(S, c.sku).id, qtd: c.qtd, preco: c.preco }))
    });
    if (r.error) throw r.error;
    ui.cart = []; ui.cliente = ''; ui.novoNome = ''; ui.novoWa = ''; ui.ultima = r.data.numero;
    await carregarLoja(); toast('Venda #' + r.data.numero + ' registrada');
  }),
  'nova-venda': () => { ui.ultima = null; render(); },
  'e+': b => { ui.entrada.find(x => x.sku === b.dataset.sku).qtd++; render(); },
  'e-': b => { const c = ui.entrada.find(x => x.sku === b.dataset.sku); c.qtd--; if (c.qtd <= 0) ui.entrada = ui.entrada.filter(x => x !== c); render(); },
  'e-rm': b => { ui.entrada = ui.entrada.filter(x => x.sku !== b.dataset.sku); render(); },
  'limpa-entrada': () => { ui.entrada = []; render(); },
  'conf-entrada': () => ocupado(async () => {
    const linhas = ui.entrada.map(x => ({ loja_id: ctx.lojaId, produto_id: prod(S, x.sku).id, tipo: 'entrada', qtd: x.qtd, ref: 'Entrada pelo leitor' }));
    const r = await sb().from('movimentos').insert(linhas); if (r.error) throw r.error;
    const n = ui.entrada.reduce((s, x) => s + x.qtd, 0); ui.entrada = []; await carregarLoja(); toast(n + ' peças adicionadas ao estoque');
  }),
  'aplicar-conf': () => ocupado(async () => {
    const linhas = Object.entries(ui.conf).map(([s, c]) => { const p = prod(S, s); return { p, d: c - p.estoque }; }).filter(x => x.d)
      .map(x => ({ loja_id: ctx.lojaId, produto_id: x.p.id, tipo: 'ajuste', qtd: x.d, ref: 'Conferência' }));
    const r = await sb().from('movimentos').insert(linhas); if (r.error) throw r.error;
    ui.conf = {}; await carregarLoja(); toast(linhas.length + ' ajuste(s) aplicado(s)');
  }),
  'limpa-conf': () => { ui.conf = {}; render(); },
  'ins-add': async () => { const r = await sb().from('insumos').insert({ loja_id: ctx.lojaId, nome: 'Novo insumo', tipo: 'Embalagem', total: 0, qtd: 100 }); if (r.error) return falha(r.error); recarregar(); },
  'ins-rm': async b => { const r = await sb().from('insumos').delete().eq('id', Number(b.dataset.id)); if (r.error) return falha(r.error); recarregar(); },
  'hist-filtro': b => { ui.hist = { tabela: b.dataset.k, pag: 0, itens: null, fim: false }; render(); },
  'hist-mais': () => { ui.hist.pag++; carregarHistorico(true); },
  'membro-rm': async b => {
    if (b.dataset.confirma !== '1') { b.dataset.confirma = '1'; b.textContent = 'Confirmar remoção'; return; }
    const r = await sb().from('membros').delete().eq('loja_id', ctx.lojaId).eq('user_id', b.dataset.uid);
    if (r.error) return falha(r.error); toast('Pessoa removida da loja'); carregarEquipe();
  },
  'convite-rm': async b => { const r = await sb().from('convites').delete().eq('id', b.dataset.id); if (r.error) return falha(r.error); carregarEquipe(); },
  'abrir-loja': b => trocarLoja(b.dataset.id),
  aj: b => { ui.aj = b.dataset.k; try { localStorage.setItem('eo-aj', ui.aj); } catch (e) {} render(); window.scrollTo(0, 0); },
  'dlg-close': () => { document.getElementById('dlg').close(); draft = null; },
  'dlg-arquivar': async b => {
    if (b.dataset.confirma !== '1') { b.dataset.confirma = '1'; b.textContent = 'Confirmar: arquivar'; return; }
    const r = await sb().from('produtos').update({ ativo: false }).eq('id', draft.id);
    if (r.error) return falha(r.error);
    document.getElementById('dlg').close(); draft = null; toast('Peça arquivada'); recarregar();
  },
  'dlg-save': async b => {
    const d = draft; if (!d.nome.trim()) { toast('Dê um nome à peça', 'bad'); document.getElementById('d-nome').focus(); return; }
    b.disabled = true;
    const rec = { nome: d.nome.trim(), categoria: d.cat.trim(), fornecedor: d.forn.trim(), sku_fornecedor: d.skuF.trim(), custo: d.custo, preco: d.preco, estoque_minimo: d.min };
    try {
      if (d.novo) {
        const r = await sb().from('produtos').insert({ ...rec, loja_id: ctx.lojaId, sku: d.sku }).select('id').single();
        if (r.error) throw r.error;
        if (d.inicial > 0) { const m = await sb().from('movimentos').insert({ loja_id: ctx.lojaId, produto_id: r.data.id, tipo: 'entrada', qtd: d.inicial, ref: 'Estoque inicial' }); if (m.error) throw m.error; }
      } else {
        const r = await sb().from('produtos').update(rec).eq('id', d.id); if (r.error) throw r.error;
      }
      document.getElementById('dlg').close(); toast(d.novo ? 'Peça cadastrada' : 'Peça salva'); draft = null; await recarregar();
    } catch (e) { b.disabled = false; falha(e); }
  }
};
async function trocarLoja(id) {
  const x = ctx.lojas.find(l => l.loja.id === id); if (!x) return;
  ctx.lojaId = id; ctx.papel = x.papel; try { localStorage.setItem('eo-loja', id); } catch (e) {}
  ui.cart = []; ui.entrada = []; ui.conf = {}; ui.sel = []; ui.ultima = null; ui.equipe = null; ui.hist = { tabela: 'todas', pag: 0, itens: null, fim: false };
  await iniciarLoja();
}

document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const f = A[b.dataset.act]; if (f) f(b, e); });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'codigo') { e.preventDefault(); A.bipar(); } });
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'foto') { lerFoto(t.files && t.files[0]); t.value = ''; return; }
  if (t.id === 'troca-loja') { trocarLoja(t.value); return; }
  const k = t.dataset.bind;
  if (k === 'mes') { ui.mes = t.value; render(); }
  else if (k === 'vmes') { ui.vmes = t.value; render(); }
  else if (k === 'parc') { ui.parc = Number(t.value); render(); }
  else if (k === 'cliente') { ui.cliente = t.value; render(); }
  else if (k === 'arred') { S.settings.arredondar = t.checked; salvarLoja({ arredondar: t.checked }); render(); }
  else if (k === 'preco') { const c = ui.cart.find(x => x.sku === t.dataset.sku); c.preco = Math.max(0, numIn(t.value)); c.manual = true; render(); }
  else if (k === 'ins' && t.dataset.k === 'tipo') { const i = S.insumos.find(x => x.id === Number(t.dataset.id)); i.tipo = t.value; salvarInsumo(i); }
  else if (k === 'papel') { sb().from('membros').update({ papel: t.value }).eq('loja_id', ctx.lojaId).eq('user_id', t.dataset.uid).then(r => { if (r.error) falha(r.error); else toast('Papel atualizado'); carregarEquipe(); }); }
});
document.addEventListener('input', e => {
  const t = e.target; const k = t.dataset.bind;
  if (t.dataset.dbind && draft) { const f = t.dataset.dbind;
    if (f === 'custo') draft.custo = Math.max(0, numIn(t.value));
    else if (f === 'preco') draft.preco = t.value.trim() === '' ? null : Math.max(0, numIn(t.value));
    else if (f === 'min' || f === 'inicial') draft[f] = Math.max(0, Math.round(numIn(t.value)));
    else draft[f] = t.value;
    const pv = document.getElementById('dlg-prev'); if (pv) pv.innerHTML = dlgPreview(); return; }
  if (!k) return;
  if (k === 'q') { ui.q = t.value; render(); }
  else if (k === 'novoNome') { ui.novoNome = t.value; render(); }
  else if (k === 'novoWa') { ui.novoWa = t.value; }
  else if (k === 'marca') { const f = t.dataset.k; S.marca[f] = t.value; render();
    const col = { nome: 'nome', assinatura: 'assinatura', insta: 'instagram' }[f];
    if (f !== 'nome' || t.value.trim().length >= 2) depois('marca-' + f, () => salvarLoja({ [col]: f === 'nome' ? t.value.trim() : t.value })); }
  else if (k === 'copia') { ui.copias[t.dataset.sku] = Math.min(60, Math.max(0, Math.round(numIn(t.value)))); const sc = window.scrollY; render(); window.scrollTo(0, sc); }
  else if (k === 'set') { const v = numIn(t.value); const key = t.dataset.k; if (key === 'markup' && (v <= 0 || v >= 20)) return; if ((key === 'taxaCartao' || key === 'imposto') && (v < 0 || v >= 100)) return;
    S.settings[key] = v; render(); const col = { markup: 'markup', taxaCartao: 'taxa_cartao', imposto: 'imposto' }[key]; depois('set-' + key, () => salvarLoja({ [col]: v })); }
  else if (k === 'sim') { ui.simCusto = t.value; render(); }
  else if (k === 'ins') { const i = S.insumos.find(x => x.id === Number(t.dataset.id)); const f = t.dataset.k;
    if (f === 'nome') i.nome = t.value; else if (f === 'total') i.total = Math.max(0, numIn(t.value)); else if (f === 'qtd') i.qtd = Math.max(0, Math.round(numIn(t.value)));
    render(); depois('ins-' + i.id, () => salvarInsumo(i)); }
});
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  if (f.id === 'form-convite') {
    const email = document.getElementById('cv-email').value.trim().toLowerCase(), papel = document.getElementById('cv-papel').value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Informe um e-mail válido', 'bad'); return; }
    const r = await sb().from('convites').insert({ loja_id: ctx.lojaId, email, papel });
    if (r.error) return falha(r.error); toast('Convite criado para ' + email); carregarEquipe();
  } else if (f.id === 'form-loja') {
    const nome = document.getElementById('nova-loja').value.trim(); if (nome.length < 2) return;
    const r = await sb().rpc('criar_loja', { p_nome: nome }); if (r.error) return falha(r.error);
    await carregarContexto(); toast('Loja criada'); trocarLoja(r.data);
  } else if (f.id === 'form-nome') {
    const nome = document.getElementById('ct-nome').value.trim();
    const r = await sb().from('perfis').update({ nome }).eq('id', ctx.user.id); if (r.error) return falha(r.error);
    ctx.perfil.nome = nome; toast('Nome salvo');
  } else if (f.id === 'form-senha') {
    const s = document.getElementById('ct-senha').value;
    if (!EO.senhaForte(s)) { toast('A senha precisa cumprir todas as regras.', 'bad'); return; }
    const r = await sb().auth.updateUser({ password: s }); if (r.error) return falha(r.error);
    document.getElementById('ct-senha').value = ''; toast('Senha alterada');
  }
});
document.getElementById('dlg').addEventListener('close', () => { draft = null; });
// liga regras de senha quando a área de conta aparece
new MutationObserver(() => {
  const i = document.getElementById('ct-senha');
  if (i && !i.dataset.ligado) { i.dataset.ligado = '1'; EO.ligarSenha(i, document.getElementById('ct-regras'), document.getElementById('ct-barra')); EO.ligarMostrar(i.closest('form')); }
}).observe(document.getElementById('view'), { childList: true, subtree: true });

/* ---------- início ---------- */
async function iniciarLoja() {
  if (!ctx.lojaId) {
    tela('Você ainda não tem uma loja', 'Sua conta não está ligada a nenhuma loja. Se você foi convidada, peça para a dona conferir o e-mail do convite. Para abrir a sua própria loja, fale no WhatsApp (31) 97310-9443.');
    return;
  }
  const x = ctx.lojas.find(l => l.loja.id === ctx.lojaId);
  if (x && !x.loja.ativa) {
    tela('Loja suspensa', 'O acesso a ' + esc(x.loja.nome) + ' está suspenso. Para reativar, fale no WhatsApp (31) 97310-9443.');
    return;
  }
  await carregarLoja(); render();
}
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const s = await EO.exigirSessao(); if (!s) return;
    ctx.user = s.user;
    sb().auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') location.replace('entrar.html'); });
    if (location.hash.includes('access_token')) history.replaceState(null, '', location.pathname);
    await carregarContexto();
    EO.vigiarSessao();
    await iniciarLoja();
  } catch (e) {
    console.error(e);
    document.getElementById('view').innerHTML = `<div class="locked"><h2>Não foi possível abrir a loja</h2><p>${esc(traduz(e))}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></div>`;
  }
  window.addEventListener('load', () => drawQR(document));
});
})();
