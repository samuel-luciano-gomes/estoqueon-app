// EstoqueOn celular — início, leitor de QR ao vivo, produtos (cards/lista), clientes e pós-venda, caixa e nota fiscal.
(function () {
'use strict';
const sb = () => EO.cliente();

/* ---------- ícones ---------- */
const I = {
  inicio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg>',
  produtos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18 3-18"/></svg>',
  leitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="4" height="4"/><rect x="13" y="7" width="4" height="4"/><rect x="7" y="13" width="4" height="4"/><path d="M13 13h4v4"/></svg>',
  clientes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
  caixa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
  busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>',
  lista: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>'
};
const NAV = [['inicio', 'Início'], ['produtos', 'Produtos'], ['leitor', 'Leitor'], ['clientes', 'Clientes'], ['caixa', 'Caixa']];

/* ---------- paletas (iguais às do sistema) ---------- */
const PALETAS = {
  rose: { light: { bg: '#FBF7F6', surface: '#FFFFFF', 'surface-2': '#F6EDEB', ink: '#2B1F22', muted: '#85706F', line: '#EEDFDC', accent: '#A0596A', 'accent-ink': '#FFFFFF', 'accent-soft': '#F7E6E8', gold: '#A7834A', 'gold-soft': '#F5ECDD' },
    dark: { bg: '#171213', surface: '#201819', 'surface-2': '#2A2022', ink: '#F4E9E8', muted: '#B39D9E', line: '#3A2C2E', accent: '#E3A7B1', 'accent-ink': '#2A1317', 'accent-soft': '#3A2328', gold: '#D9B77A', 'gold-soft': '#2F2618' } },
  gold: { light: { bg: '#FAF8F3', surface: '#FFFFFF', 'surface-2': '#F3EEE3', ink: '#26211A', muted: '#7C7262', line: '#E9E1D1', accent: '#8C6A2F', 'accent-ink': '#FFFFFF', 'accent-soft': '#F4ECDC', gold: '#A4636E', 'gold-soft': '#F6E8E8' },
    dark: { bg: '#15130F', surface: '#1D1A15', 'surface-2': '#27231C', ink: '#F2ECE0', muted: '#ADA290', line: '#38322A', accent: '#D9B977', 'accent-ink': '#231B0C', 'accent-soft': '#332A19', gold: '#E0A9B2', 'gold-soft': '#33222A' } },
  perola: { light: { bg: '#FFFFFF', surface: '#FFFFFF', 'surface-2': '#F7F6F3', ink: '#1C1B1A', muted: '#77736E', line: '#ECE9E4', accent: '#1C1B1A', 'accent-ink': '#FFFFFF', 'accent-soft': '#F2F0EC', gold: '#A08048', 'gold-soft': '#F6F0E4' },
    dark: { bg: '#121211', surface: '#1A1A19', 'surface-2': '#242322', ink: '#F3F1EC', muted: '#A7A39C', line: '#33312E', accent: '#F3F1EC', 'accent-ink': '#121211', 'accent-soft': '#2A2927', gold: '#D4B57E', 'gold-soft': '#2C261B' } }
};
function aplicarMarca() {
  const p = PALETAS[D && D.loja.paleta] || PALETAS.rose;
  const decl = o => Object.entries(o).map(([k, v]) => `--${k}:${v}`).join(';');
  let el = document.getElementById('brandcss');
  if (!el) { el = document.createElement('style'); el.id = 'brandcss'; document.head.appendChild(el); }
  el.textContent = `:root{${decl(p.light)}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${decl(p.dark)};color-scheme:dark}}:root[data-theme="dark"]{${decl(p.dark)};color-scheme:dark}`;
}

/* ---------- utilidades ---------- */
const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoDe = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hoje = () => isoDe(new Date());
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const mesNome = k => MESES[+k.slice(5, 7) - 1] + ' de ' + k.slice(0, 4);
const dataBR = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '—';
const diaBR = iso => { const d = new Date(iso + 'T12:00:00'); const h = hoje(); const ont = isoDe(new Date(Date.now() - 864e5)); return iso === h ? 'Hoje' : iso === ont ? 'Ontem' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }); };
const dias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const numIn = v => { const s = String(v).trim(); const n = parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s); return isFinite(n) ? n : 0; };
const fone = d => { d = String(d || '').replace(/\D/g, ''); return d.length === 11 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7) : d.length === 10 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6) : d; };
const wa = (d, msg) => 'https://wa.me/55' + String(d || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
const iniciais = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const primeiro = n => String(n || '').trim().split(/\s+/)[0] || '';
const vibrar = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
let audioCtx = null;
function bip(ok) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = ok ? 1320 : 330; g.gain.value = 0.06; o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + (ok ? 0.08 : 0.25));
  } catch (e) {}
}

/* ---------- regras de preço (iguais às do banco) ---------- */
const rateio = () => D.insumos.reduce((s, i) => s + (i.qtd > 0 ? Number(i.total) / i.qtd : 0), 0);
const arred = v => { if (!D.loja.arredondar) return Math.round(v * 100) / 100; let r = Math.floor(v) + 0.9; if (r < v - 1e-9) r += 1; return Math.round(r * 100) / 100; };
const custoTotal = p => Number(p.custo) + rateio();
const calcVista = p => arred(custoTotal(p) * Number(D.loja.markup) / (1 - Number(D.loja.imposto) / 100));
const vista = p => p.preco != null ? Number(p.preco) : calcVista(p);
const cartao = v => arred(v / (1 - Number(D.loja.taxa_cartao) / 100));
const precoPara = (p, pag) => pag === 'cartao' ? cartao(vista(p)) : vista(p);

/* ---------- estado ---------- */
let ctx = { user: null, perfil: null, master: false, lojas: [], lojaId: null, papel: null };
let D = null;
const ler = (k, d) => { try { const v = localStorage.getItem('eo-m-' + k); return v == null ? d : v; } catch (e) { return d; } };
const gravar = (k, v) => { try { localStorage.setItem('eo-m-' + k, v); } catch (e) {} };
let ui = {
  tab: 'inicio', modo: ler('modo', 'venda'), vista: ler('vista', 'cards'), q: '', filtro: 'todos',
  cq: '', cfiltro: 'todas', caixaMes: hoje().slice(0, 7), carrinho: [], feed: [], ocupado: false
};
const dona = () => ctx.papel === 'dona';
if (NAV.some(([k]) => k === location.hash.slice(1))) ui.tab = location.hash.slice(1);

/* ---------- avisos ---------- */
function toast(msg, kind) { const box = document.getElementById('toast'); const el = document.createElement('div'); el.className = 't' + (kind ? ' ' + kind : ''); el.textContent = msg; box.appendChild(el); setTimeout(() => el.remove(), kind === 'bad' ? 4500 : 2200); }
function traduz(e) {
  const m = String((e && (e.message || e.details)) || e || '');
  if (/row-level security|permission denied/i.test(m)) return 'Você não tem permissão para isso. Peça para a dona da loja.';
  if (/duplicate key.*sku/i.test(m)) return 'Já existe uma peça com esse código.';
  return EO.erro(e);
}
function falha(e) { console.error(e); toast(traduz(e), 'bad'); }

/* ---------- carregamento ---------- */
async function carregarContexto() {
  const uid = ctx.user.id;
  const [perf, mast, mem] = await Promise.all([
    sb().from('perfis').select('*').eq('id', uid).maybeSingle(),
    sb().from('masters').select('user_id').eq('user_id', uid).maybeSingle(),
    sb().from('membros').select('papel, lojas(*)').eq('user_id', uid)
  ]);
  if (mem.error) throw mem.error;
  ctx.perfil = perf.data || { nome: '' };
  ctx.master = !!mast.data;
  ctx.lojas = (mem.data || []).filter(m => m.lojas).map(m => ({ papel: m.papel, loja: m.lojas })).sort((a, b) => a.loja.criado_em.localeCompare(b.loja.criado_em));
  const salva = ler('loja', null) || (() => { try { return localStorage.getItem('eo-loja'); } catch (e) { return null; } })();
  const atual = ctx.lojas.find(l => l.loja.id === salva) || ctx.lojas[0];
  ctx.lojaId = atual ? atual.loja.id : null; ctx.papel = atual ? atual.papel : null;
}
async function carregar() {
  const id = ctx.lojaId;
  const desde = isoDe(new Date(Date.now() - 400 * 864e5));
  const [lj, ins, prs, cls, vds, lcs, cts] = await Promise.all([
    sb().from('lojas').select('*').eq('id', id).single(),
    sb().from('insumos').select('*').eq('loja_id', id),
    sb().from('produtos_estoque').select('*').eq('loja_id', id).eq('ativo', true).order('nome'),
    sb().from('clientes').select('*').eq('loja_id', id).order('nome'),
    sb().from('vendas').select('id,numero,data,cliente_id,total,pagamento,parcelas,venda_itens(produto_id,qtd,preco)').eq('loja_id', id).gte('data', desde).order('data', { ascending: false }),
    sb().from('lancamentos').select('*').eq('loja_id', id).gte('data', ui.caixaMes + '-01').lt('data', proxMes(ui.caixaMes) + '-01').order('data', { ascending: false }).order('id', { ascending: false }),
    sb().from('contatos').select('*').eq('loja_id', id).gte('criado_em', new Date(Date.now() - 400 * 864e5).toISOString()).order('criado_em', { ascending: false })
  ]);
  for (const r of [lj, ins, prs, cls, vds, lcs, cts]) if (r.error) throw r.error;
  D = {
    loja: lj.data, insumos: ins.data,
    produtos: prs.data.map(p => ({ ...p, skuF: p.sku_fornecedor, custo: Number(p.custo), preco: p.preco == null ? null : Number(p.preco), estoque: Number(p.estoque) })),
    clientes: cls.data, vendas: vds.data.map(v => ({ ...v, total: Number(v.total) })), lanc: lcs.data.map(l => ({ ...l, valor: Number(l.valor) })), contatos: cts.data
  };
}
async function recarregarCaixa() {
  const r = await sb().from('lancamentos').select('*').eq('loja_id', ctx.lojaId).gte('data', ui.caixaMes + '-01').lt('data', proxMes(ui.caixaMes) + '-01').order('data', { ascending: false }).order('id', { ascending: false });
  if (r.error) return falha(r.error);
  D.lanc = r.data.map(l => ({ ...l, valor: Number(l.valor) })); render();
}
const proxMes = k => { let y = +k.slice(0, 4), m = +k.slice(5, 7) + 1; if (m > 12) { m = 1; y++; } return y + '-' + pad(m); };
const antMes = k => { let y = +k.slice(0, 4), m = +k.slice(5, 7) - 1; if (m < 1) { m = 12; y--; } return y + '-' + pad(m); };
async function atualizar() { try { await carregar(); render(); } catch (e) { falha(e); } }

/* ---------- dados derivados ---------- */
const prodPorCodigo = c => { c = String(c || '').trim().toUpperCase(); return D.produtos.find(p => p.sku.toUpperCase() === c || (p.skuF && p.skuF.toUpperCase() === c) || (p.ean && p.ean === c)); };
const prodId = id => D.produtos.find(p => p.id === id);
const cliId = id => D.clientes.find(c => c.id === id);
function resumoCliente(c) {
  const vs = D.vendas.filter(v => v.cliente_id === c.id);
  const ultima = vs[0] ? vs[0].data : null;
  const contatos = D.contatos.filter(x => x.cliente_id === c.id);
  return { vs, n: vs.length, total: vs.reduce((s, v) => s + v.total, 0), ultima, contatos, ultimoContato: contatos[0] ? contatos[0].criado_em.slice(0, 10) : null };
}
function proxAniversario(c) {
  if (!c.aniversario) return null;
  const h = new Date(hoje() + 'T12:00:00'); let d = new Date(h.getFullYear() + c.aniversario.slice(4) + 'T12:00:00');
  if (d < h) d = new Date((h.getFullYear() + 1) + c.aniversario.slice(4) + 'T12:00:00');
  return Math.round((d - h) / 864e5);
}
function posVenda() {
  const h = hoje(); const agradecer = [], aniversario = [], saudade = [];
  D.clientes.forEach(c => {
    const r = resumoCliente(c);
    if (r.ultima && dias(r.ultima, h) <= 7 && !r.contatos.some(x => x.tipo === 'agradecimento' && x.criado_em.slice(0, 10) >= r.ultima)) agradecer.push({ c, r });
    const pa = proxAniversario(c);
    if (pa != null && pa <= 7 && !r.contatos.some(x => x.tipo === 'aniversario' && dias(x.criado_em.slice(0, 10), h) <= 20)) aniversario.push({ c, r, pa });
    if (r.ultima && dias(r.ultima, h) >= 60 && !(r.ultimoContato && dias(r.ultimoContato, h) < 30)) saudade.push({ c, r });
  });
  aniversario.sort((a, b) => a.pa - b.pa);
  saudade.sort((a, b) => b.r.total - a.r.total);
  return { agradecer, aniversario, saudade };
}

/* ---------- mensagens de WhatsApp ---------- */
function msg(tipo, c, extra) {
  const loja = D.loja.nome, n = primeiro(c.nome), ig = D.loja.instagram ? ` Novidades no ${D.loja.instagram}.` : '';
  if (tipo === 'agradecimento') return `Oi, ${n}! Aqui é da ${loja}. Obrigada pela sua compra! Se precisar de qualquer coisa com as suas peças, é só me chamar. Para conservar o brilho, guarde longe de perfume e da umidade.${ig}`;
  if (tipo === 'aniversario') return `Oi, ${n}! Feliz aniversário! Toda a equipe da ${loja} deseja um dia lindo. Separei um carinho para você: me chama aqui que te conto.`;
  if (tipo === 'reativacao') return `Oi, ${n}! Que saudade de você aqui na ${loja}. Chegaram peças novas que combinam com você. Quer que eu te mande fotos?`;
  if (tipo === 'oferta') return (extra || '').replace(/\{nome\}/g, n);
  return `Oi, ${n}!`;
}
async function enviarWhats(c, tipo, texto) {
  if (!c.whatsapp) { toast('Cadastre o WhatsApp de ' + primeiro(c.nome) + ' primeiro.', 'bad'); return false; }
  window.open(wa(c.whatsapp, texto), '_blank', 'noopener');
  const r = await sb().from('contatos').insert({ loja_id: ctx.lojaId, cliente_id: c.id, tipo, mensagem: texto.slice(0, 1000) }).select().single();
  if (r.error) { falha(r.error); return true; }
  D.contatos.unshift(r.data); return true;
}

/* ---------- moldura ---------- */
function renderTopo() {
  const l = D ? D.loja : null;
  document.getElementById('brand').innerHTML = `<span class="mono-mark">${esc(l ? (l.nome.replace(/^(ateli[eê]|loja|studio|casa)\s+/i, '')[0] || 'E').toUpperCase() : 'E')}</span><span class="m-brand-txt"><b>${esc(l ? l.nome : 'EstoqueOn')}</b><small>${ctx.lojas.length > 1 ? 'toque para trocar de loja' : 'EstoqueOn'}</small></span>`;
  document.getElementById('nav').innerHTML = NAV.map(([k, t]) => k === 'leitor'
    ? `<button class="scan" data-act="tab" data-k="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}><span class="bola">${I.leitor}</span><span>${t}</span></button>`
    : `<button data-act="tab" data-k="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}>${I[k]}<span>${t}</span></button>`).join('');
}
function render() {
  const a = document.activeElement; const fid = a && a.id && a.closest('#view') ? a.id : null; let ss = null;
  try { if (fid && a.selectionStart != null) ss = a.selectionStart; } catch (e) {}
  aplicarMarca(); renderTopo();
  if (ui.tab !== 'leitor') pararCamera();
  const v = document.getElementById('view');
  v.innerHTML = ({ inicio: vInicio, produtos: vProdutos, leitor: vLeitor, clientes: vClientes, caixa: vCaixa })[ui.tab]();
  if (ui.tab === 'leitor') montarCamera();
  if (fid) { const el = document.getElementById(fid); if (el) { el.focus({ preventScroll: true }); try { if (ss != null) el.setSelectionRange(ss, ss); } catch (e) {} } }
}
function irPara(tab) { ui.tab = tab; render(); window.scrollTo(0, 0); }

/* ---------- INÍCIO ---------- */
function vInicio() {
  const h = hoje(), mes = h.slice(0, 7);
  const vHoje = D.vendas.filter(v => v.data === h);
  const lmes = mes === ui.caixaMes ? D.lanc : [];
  const ent = lmes.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0), sai = lmes.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);
  const pv = posVenda(); const pend = pv.agradecer.length + pv.aniversario.length + pv.saudade.length;
  const baixos = D.produtos.filter(p => p.estoque <= p.estoque_minimo);
  const hr = new Date().getHours(); const saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  return `
  <section class="hello"><span class="eyebrow">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
    <h1>${saud}${ctx.perfil.nome ? ', <em>' + esc(primeiro(ctx.perfil.nome)) + '</em>' : ''}</h1>
    <p>${vHoje.length ? `Hoje já foram <b>${vHoje.length} venda${vHoje.length > 1 ? 's' : ''}</b>, somando ${brl(vHoje.reduce((s, v) => s + v.total, 0))}.` : 'Nenhuma venda hoje ainda. Toque no leitor para registrar a primeira.'}</p></section>
  <button class="btn primary grande" data-act="tab" data-k="leitor">Ler QR da etiqueta</button>
  <div class="g2">
    <button class="stat" data-act="tab" data-k="caixa" style="text-align:left;color:inherit"><span class="lbl">Saldo de ${MESES[+mes.slice(5) - 1]}</span><span class="val num ${ent - sai >= 0 ? 'pos' : 'neg'}">${brl(ent - sai)}</span><span class="sub">entrou ${brl(ent)} · saiu ${brl(sai)}</span></button>
    <button class="stat" data-act="tab" data-k="clientes" style="text-align:left;color:inherit" data-cf="pos"><span class="lbl">Pós-venda</span><span class="val num">${pend}</span><span class="sub">${pend ? 'clientes para chamar' : 'tudo em dia'}</span></button>
  </div>
  ${pend ? `<div class="card grid"><div class="secao-t"><h3>Chame hoje</h3><button class="btn sm ghost" data-act="ir-pos">Ver tudo</button></div>
    <div>${[...pv.aniversario.slice(0, 2).map(x => tarefa(x.c, x.pa === 0 ? 'Faz aniversário hoje' : `Aniversário em ${x.pa} dia${x.pa > 1 ? 's' : ''}`, 'aniversario')),
      ...pv.agradecer.slice(0, 3).map(x => tarefa(x.c, `Comprou ${x.r.ultima === h ? 'hoje' : 'em ' + dataBR(x.r.ultima).slice(0, 5)} · agradecer`, 'agradecimento')),
      ...pv.saudade.slice(0, 2).map(x => tarefa(x.c, `Sem comprar há ${dias(x.r.ultima, h)} dias`, 'reativacao'))].join('')}</div></div>` : ''}
  ${baixos.length ? `<div class="card grid"><div class="secao-t"><h3>Estoque baixo</h3><span class="pill warn">${baixos.length}</span></div>
    <div class="lista" style="border:0">${baixos.slice(0, 5).map(lrow).join('')}</div></div>` : ''}
  <p class="small muted" style="text-align:center">Plano ${esc(D.loja.plano.replace(/^./, c => c.toUpperCase()))} · <a href="app.html">Abrir o sistema completo</a></p>`;
}
function tarefa(c, sub, tipo) {
  return `<div class="tarefa"><div class="t"><b>${esc(c.nome)}</b><span>${esc(sub)}</span></div><button class="btn sm wa" data-act="whats" data-id="${c.id}" data-tipo="${tipo}">WhatsApp</button></div>`;
}

/* ---------- PRODUTOS ---------- */
function foto(p, cls) {
  return `<div class="foto ${cls || ''}">${p.foto_url ? `<img src="${esc(p.foto_url)}" alt="" loading="lazy">` : esc(iniciais(p.nome))}</div>`;
}
const pillEst = p => `<span class="pill ${p.estoque <= 0 ? 'bad' : p.estoque <= p.estoque_minimo ? 'warn' : 'neutral'} num">${p.estoque} un.</span>`;
function lrow(p) {
  return `<button class="lrow" data-act="produto" data-id="${p.id}">${foto(p)}<span class="t"><b>${esc(p.nome)}</b><span>${esc(p.sku)}${p.categoria ? ' · ' + esc(p.categoria) : ''}</span></span><span class="r"><span class="num">${brl(vista(p))}</span>${pillEst(p)}</span></button>`;
}
function filtrarProdutos() {
  const q = ui.q.trim().toLowerCase();
  let ps = D.produtos.filter(p => !q || (p.nome + ' ' + p.sku + ' ' + p.categoria + ' ' + p.fornecedor + ' ' + p.skuF).toLowerCase().includes(q));
  if (ui.filtro === 'baixo') ps = ps.filter(p => p.estoque <= p.estoque_minimo);
  else if (ui.filtro === 'semfoto') ps = ps.filter(p => !p.foto_url);
  else if (ui.filtro !== 'todos') ps = ps.filter(p => p.categoria === ui.filtro);
  return ps;
}
function vProdutos() {
  const cats = [...new Set(D.produtos.map(p => p.categoria).filter(Boolean))].sort();
  const F = [['todos', 'Todas'], ['baixo', 'Estoque baixo'], ['semfoto', 'Sem foto']].concat(cats.map(c => [c, c]));
  const ps = filtrarProdutos();
  return `
  <div class="m-head"><div><span class="eyebrow">Coleção</span><h2>Produtos</h2></div>
    <div class="seg" role="group" aria-label="Forma de exibir" style="width:auto"><button data-act="vista" data-k="cards" aria-pressed="${ui.vista === 'cards'}" aria-label="Cards" style="padding:8px 12px">${I.cards}</button><button data-act="vista" data-k="lista" aria-pressed="${ui.vista === 'lista'}" aria-label="Lista" style="padding:8px 12px">${I.lista}</button></div></div>
  ${dona() ? `<div class="dois"><button class="btn primary" data-act="nova-peca">+ Nova peça</button><button class="btn" data-act="nota">Importar nota</button></div>` : ''}
  <div class="busca">${I.busca}<input id="busca" class="inp" type="search" placeholder="Buscar peça, código ou fornecedor" value="${esc(ui.q)}" data-bind="q" autocomplete="off"></div>
  <div class="chips">${F.map(([k, l]) => `<button class="chip" data-act="filtro" data-k="${esc(k)}" aria-pressed="${ui.filtro === k}">${esc(l)}</button>`).join('')}</div>
  <p class="small muted">${ps.length} de ${D.produtos.length} peças</p>
  ${!ps.length ? `<div class="empty">${D.produtos.length ? 'Nenhuma peça com esse filtro.' : dona() ? 'Nenhuma peça ainda. Cadastre a primeira ou importe a nota fiscal do fornecedor.' : 'A dona ainda não cadastrou peças.'}</div>` :
    ui.vista === 'cards'
      ? `<div class="cards">${ps.map(p => `<button class="pcard" data-act="produto" data-id="${p.id}"><div class="foto">${p.foto_url ? `<img src="${esc(p.foto_url)}" alt="" loading="lazy">` : esc(iniciais(p.nome))}<span class="est">${pillEst(p)}</span></div><span class="info"><span class="nome">${esc(p.nome)}</span><span class="preco num">${brl(vista(p))}</span><span class="small muted num">${brl(cartao(vista(p)))} no cartão</span></span></button>`).join('')}</div>`
      : `<div class="lista">${ps.map(lrow).join('')}</div>`}`;
}

function abrirProduto(p) {
  const v = vista(p); const ro = dona() ? '' : 'disabled';
  abrirSheet(`
  <div class="sheet-head"><div><span class="eyebrow">${esc(p.sku)}${p.categoria ? ' · ' + esc(p.categoria) : ''}</span><h2>${esc(p.nome)}</h2></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
  ${foto(p, 'grande')}
  ${dona() ? `<label class="btn" style="position:relative">${p.foto_url ? 'Trocar foto' : 'Tirar ou escolher foto'}<input type="file" id="foto-in" accept="image/*" capture="environment" style="position:absolute;inset:0;opacity:0" data-id="${p.id}"></label>` : ''}
  <div class="g2"><div class="stat"><span class="lbl">À vista / Pix</span><span class="val num">${brl(v)}</span></div><div class="stat"><span class="lbl">Cartão até 3x</span><span class="val num">${brl(cartao(v))}</span></div></div>
  <div class="card grid"><div class="secao-t"><div><h3>Estoque</h3><span class="small muted">mínimo ${p.estoque_minimo}</span></div>
    <div class="passo"><button data-act="ajuste" data-id="${p.id}" data-q="-1" aria-label="Tirar uma">−</button><span class="num">${p.estoque}</span><button data-act="ajuste" data-id="${p.id}" data-q="1" aria-label="Somar uma">+</button></div></div>
    <span class="hint">O − registra saída e o + registra entrada no estoque, com o seu nome no histórico.</span></div>
  ${dona() ? `<details class="card"><summary style="cursor:pointer;font-weight:500">Editar dados da peça</summary>
    <form id="form-peca" class="grid" style="margin-top:12px" data-id="${p.id}">
      <div class="field"><label for="pp-nome">Nome</label><input id="pp-nome" class="inp" value="${esc(p.nome)}" maxlength="80" ${ro}></div>
      <div class="dois"><div class="field"><label for="pp-cat">Categoria</label><input id="pp-cat" class="inp" value="${esc(p.categoria)}" maxlength="40"></div><div class="field"><label for="pp-min">Estoque mínimo</label><input id="pp-min" class="inp num" inputmode="numeric" value="${p.estoque_minimo}"></div></div>
      <div class="dois"><div class="field"><label for="pp-custo">Custo (R$)</label><input id="pp-custo" class="inp num" inputmode="decimal" value="${String(p.custo).replace('.', ',')}"></div><div class="field"><label for="pp-preco">Preço à vista</label><input id="pp-preco" class="inp num" inputmode="decimal" value="${p.preco != null ? String(p.preco).replace('.', ',') : ''}" placeholder="${brl(calcVista(p))}"></div></div>
      <div class="dois"><div class="field"><label for="pp-forn">Fornecedor</label><input id="pp-forn" class="inp" value="${esc(p.fornecedor)}" maxlength="60"></div><div class="field"><label for="pp-skuf">Cód. fornecedor</label><input id="pp-skuf" class="inp" value="${esc(p.skuF)}" maxlength="40"></div></div>
      <div class="field"><label for="pp-ean">Código de barras (EAN)</label><input id="pp-ean" class="inp num" inputmode="numeric" value="${esc(p.ean)}" maxlength="20"></div>
      <span class="hint">Preço vazio usa o calculado: ${brl(calcVista(p))}.</span>
      <button class="btn primary" type="submit">Salvar peça</button></form></details>` : ''}
  <div class="qrbox"><div class="qr" data-qr="${esc(p.sku)}"></div><span class="small">${esc(D.loja.nome)} · ${esc(p.sku)}</span></div>
  <div class="dois"><button class="btn" data-act="add-carrinho" data-id="${p.id}">Vender esta peça</button><button class="btn" data-act="oferta-peca" data-id="${p.id}">Oferecer a clientes</button></div>`);
  desenharQR();
}
function abrirNovaPeca() {
  abrirSheet(`
  <div class="sheet-head"><div><span class="eyebrow">Cadastro</span><h2>Nova peça</h2></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
  <form id="form-nova" class="grid">
    <div class="field"><label for="np-nome">Nome</label><input id="np-nome" class="inp" maxlength="80" required placeholder="Ex.: Brinco gota cristal"></div>
    <div class="dois"><div class="field"><label for="np-cat">Categoria</label><input id="np-cat" class="inp" maxlength="40" list="cats"></div><div class="field"><label for="np-forn">Fornecedor</label><input id="np-forn" class="inp" maxlength="60"></div></div>
    <datalist id="cats">${[...new Set(D.produtos.map(p => p.categoria).filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    <div class="dois"><div class="field"><label for="np-custo">Custo (R$)</label><input id="np-custo" class="inp num" inputmode="decimal" required></div><div class="field"><label for="np-qtd">Quantidade</label><input id="np-qtd" class="inp num" inputmode="numeric" value="1"></div></div>
    <div class="field"><label for="np-skuf">Código do fornecedor ou de barras</label><input id="np-skuf" class="inp" maxlength="40" placeholder="opcional"></div>
    <div class="kv" id="np-prev"><div><span>Preço calculado à vista</span><b class="num">—</b></div></div>
    <button class="btn primary grande" type="submit">Cadastrar peça</button>
  </form>`);
}

/* ---------- foto da peça ---------- */
async function enviarFoto(file, id) {
  const p = prodId(id); if (!file || !p) return;
  toast('Enviando foto…');
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Não consegui abrir a foto.')); i.src = URL.createObjectURL(file); });
    const lado = 900, k = Math.min(1, lado / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
    const caminho = `${ctx.lojaId}/${p.sku}-${Date.now()}.jpg`;
    const up = await sb().storage.from('produtos').upload(caminho, blob, { contentType: 'image/jpeg', upsert: false });
    if (up.error) throw up.error;
    const url = sb().storage.from('produtos').getPublicUrl(caminho).data.publicUrl;
    const r = await sb().from('produtos').update({ foto_url: url }).eq('id', p.id); if (r.error) throw r.error;
    p.foto_url = url; toast('Foto salva', 'good'); abrirProduto(p); render();
  } catch (e) { falha(e); }
}

/* ---------- LEITOR ---------- */
let cam = { stream: null, raf: 0, detector: null, ultimo: '', quando: 0, canvas: null };
function vLeitor() {
  const M = [['venda', 'Vender'], ['entrada', 'Entrada'], ['saida', 'Saída'], ['consulta', 'Consultar']];
  const dicas = { venda: 'Cada leitura coloca a peça na sacola.', entrada: 'Cada leitura soma 1 no estoque na hora.', saida: 'Cada leitura tira 1 do estoque na hora.', consulta: 'Mostra preço e estoque da peça.' };
  const tot = ui.carrinho.reduce((s, c) => s + c.preco * c.qtd, 0), n = ui.carrinho.reduce((s, c) => s + c.qtd, 0);
  return `
  <div class="seg" role="group" aria-label="O que fazer ao ler">${M.map(([k, l]) => `<button data-act="modo" data-k="${k}" aria-pressed="${ui.modo === k}">${l}</button>`).join('')}</div>
  <div class="cam" id="cam"><div class="cam-off" id="cam-off"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg><p>${dicas[ui.modo]}</p><button class="btn primary" data-act="camera">Abrir câmera</button></div></div>
  <div style="display:flex;gap:8px"><input id="codigo" class="inp" placeholder="Ou digite o código (EO-0001)" autocomplete="off" autocapitalize="characters"><button class="btn" data-act="bipar">OK</button></div>
  ${ui.modo === 'venda' && ui.carrinho.length ? `<div class="card grid"><div class="secao-t"><h3>Sacola</h3><button class="btn sm ghost" data-act="esvaziar">Esvaziar</button></div>
    ${ui.carrinho.map(c => { const p = prodId(c.id); return `<div class="feed-item"><span><b>${esc(p.nome)}</b><br><span class="small muted num">${brl(c.preco)} · ${p.estoque} em estoque</span></span><div class="passo"><button data-act="cq" data-id="${c.id}" data-q="-1">−</button><span class="num">${c.qtd}</span><button data-act="cq" data-id="${c.id}" data-q="1">+</button></div></div>`; }).join('')}</div>
    <div class="carrinho"><div class="card"><span><b class="num" style="font-family:var(--f-display);font-size:1.3rem;font-weight:400">${brl(tot)}</b><br><span class="small muted">${n} peça${n > 1 ? 's' : ''} à vista</span></span><button class="btn primary" data-act="fechar-venda">Fechar venda</button></div></div>` : ''}
  ${(ui.modo === 'entrada' || ui.modo === 'saida') && ui.feed.length ? `<div class="grid"><h3>Últimas leituras</h3><div class="feed">${ui.feed.slice(0, 8).map((f, i) => `<div class="feed-item"><span><b>${f.q > 0 ? '+1' : '−1'} ${esc(f.nome)}</b><br><span class="small muted">agora ${f.estoque} em estoque</span></span>${i === 0 && !f.desfeito ? `<button class="btn sm" data-act="desfazer">Desfazer</button>` : f.desfeito ? '<span class="small muted">desfeito</span>' : ''}</div>`).join('')}</div></div>` : ''}`;
}
async function montarCamera() {
  if (ler('camera', '0') === '1') abrirCamera();
}
async function abrirCamera() {
  const box = document.getElementById('cam'); if (!box) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('Este navegador não libera a câmera. Digite o código.', 'bad'); return; }
  try {
    if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    gravar('camera', '1');
    box.innerHTML = `<video id="video" playsinline muted autoplay></video><div class="mira"></div><div class="ok-flash" id="flash"></div><span class="cam-modo">${{ venda: 'Vender', entrada: 'Entrada +1', saida: 'Saída −1', consulta: 'Consultar' }[ui.modo]}</span>`;
    const video = document.getElementById('video'); video.srcObject = cam.stream; await video.play().catch(() => {});
    if (!cam.detector && 'BarcodeDetector' in window) { try { cam.detector = new BarcodeDetector({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128'] }); } catch (e) { cam.detector = null; } }
    cancelAnimationFrame(cam.raf); lerQuadro();
  } catch (e) {
    gravar('camera', '0');
    toast(/NotAllowed|Permission/i.test(e.name + e.message) ? 'Libere a câmera para o EstoqueOn nas permissões do navegador.' : 'Não consegui abrir a câmera.', 'bad');
  }
}
function pararCamera() {
  cancelAnimationFrame(cam.raf);
  if (cam.stream) { cam.stream.getTracks().forEach(t => t.stop()); cam.stream = null; }
}
async function lerQuadro() {
  const video = document.getElementById('video');
  if (!video || !cam.stream) return;
  if (video.readyState >= 2) {
    let codigo = null;
    try {
      if (cam.detector) { const r = await cam.detector.detect(video); if (r && r[0]) codigo = r[0].rawValue; }
      else if (window.jsQR) {
        cam.canvas = cam.canvas || document.createElement('canvas');
        const w = 480, h = Math.round(video.videoHeight / video.videoWidth * w) || 360;
        cam.canvas.width = w; cam.canvas.height = h;
        const g = cam.canvas.getContext('2d', { willReadFrequently: true }); g.drawImage(video, 0, 0, w, h);
        const r = jsQR(g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' }); if (r) codigo = r.data;
      }
    } catch (e) {}
    const agora = Date.now();
    if (codigo && (codigo !== cam.ultimo || agora - cam.quando > 1800)) { cam.ultimo = codigo; cam.quando = agora; await lido(codigo); }
  }
  cam.raf = requestAnimationFrame(lerQuadro);
}
function piscar() { const f = document.getElementById('flash'); if (f) { f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 220); } }
async function lido(codigo) {
  const p = prodPorCodigo(codigo);
  if (!p) { bip(false); vibrar([60, 40, 60]); toast('Código ' + codigo + ' não está cadastrado', 'bad'); return; }
  bip(true); vibrar(40); piscar();
  if (ui.modo === 'consulta') { abrirProduto(p); return; }
  if (ui.modo === 'venda') {
    const c = ui.carrinho.find(x => x.id === p.id);
    if ((c ? c.qtd : 0) + 1 > p.estoque) { toast('Sem estoque de ' + p.nome, 'bad'); return; }
    if (c) c.qtd++; else ui.carrinho.push({ id: p.id, qtd: 1, preco: vista(p) });
    toast(p.nome + ' na sacola'); render(); return;
  }
  const q = ui.modo === 'entrada' ? 1 : -1;
  if (q < 0 && p.estoque <= 0) { toast('O estoque de ' + p.nome + ' já está zerado', 'bad'); return; }
  await mover(p, q, ui.modo === 'entrada' ? 'Entrada pelo celular' : 'Saída pelo celular', true);
}
async function mover(p, q, ref, noFeed) {
  const r = await sb().from('movimentos').insert({ loja_id: ctx.lojaId, produto_id: p.id, tipo: q > 0 ? 'entrada' : 'ajuste', qtd: q, ref }).select('id').single();
  if (r.error) return falha(r.error);
  p.estoque += q;
  if (noFeed) { ui.feed.unshift({ id: p.id, nome: p.nome, q, estoque: p.estoque }); toast((q > 0 ? '+1 ' : '−1 ') + p.nome + ' · agora ' + p.estoque); }
  render();
}

function abrirFecharVenda() {
  const tot = ui.carrinho.reduce((s, c) => s + c.preco * c.qtd, 0);
  ui.venda = ui.venda || { pag: 'pix', parc: 1, cliente: '', busca: '' };
  const v = ui.venda; const totPag = v.pag === 'cartao' ? ui.carrinho.reduce((s, c) => s + cartao(c.preco) * c.qtd, 0) : tot;
  const q = v.busca.trim().toLowerCase();
  const sug = q ? D.clientes.filter(c => (c.nome + ' ' + c.whatsapp).toLowerCase().includes(q)).slice(0, 6) : [];
  const escolhida = v.cliente && v.cliente !== 'nova' ? cliId(Number(v.cliente)) : null;
  abrirSheet(`
  <div class="sheet-head"><div><span class="eyebrow">Fechar venda</span><h2 class="num">${brl(totPag)}</h2></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
  <div class="field"><span class="flabel">Pagamento</span><div class="seg">${[['pix', 'Pix'], ['dinheiro', 'Dinheiro'], ['cartao', 'Cartão']].map(([k, l]) => `<button data-act="vpag" data-k="${k}" aria-pressed="${v.pag === k}">${l}</button>`).join('')}</div>
    ${v.pag === 'cartao' ? `<div class="seg" style="margin-top:6px">${[1, 2, 3].map(n => `<button data-act="vparc" data-k="${n}" aria-pressed="${v.parc === n}">${n}x ${brl(totPag / n)}</button>`).join('')}</div><span class="hint">Preço do cartão já inclui a taxa de ${String(D.loja.taxa_cartao).replace('.', ',')}%.</span>` : ''}</div>
  <div class="field"><span class="flabel">Cliente</span>
    ${escolhida ? `<div class="feed-item"><span><b>${esc(escolhida.nome)}</b><br><span class="small muted">${fone(escolhida.whatsapp) || 'sem WhatsApp'}</span></span><button class="btn sm" data-act="vcli" data-k="">Trocar</button></div>`
      : v.cliente === 'nova' ? `<div class="grid"><input id="vn-nome" class="inp" placeholder="Nome da cliente" maxlength="80"><input id="vn-wa" class="inp" inputmode="tel" placeholder="WhatsApp com DDD"><button class="btn sm ghost" data-act="vcli" data-k="">Buscar cliente cadastrada</button></div>`
      : `<input id="vbusca" class="inp" placeholder="Buscar pelo nome ou telefone" value="${esc(v.busca)}" data-bind="vbusca" autocomplete="off">
        <div class="lista" style="margin-top:6px">${sug.map(c => `<button class="crow" data-act="vcli" data-k="${c.id}"><span class="av">${esc(iniciais(c.nome))}</span><span><b>${esc(c.nome)}</b><br><span class="small muted">${fone(c.whatsapp)}</span></span><span></span></button>`).join('')}
        <button class="crow" data-act="vcli" data-k="nova"><span class="av">+</span><span><b>Nova cliente</b></span><span></span></button></div>`}</div>
  <button class="btn primary grande" data-act="confirmar-venda" ${ui.ocupado ? 'disabled' : ''}>${ui.ocupado ? 'Registrando…' : 'Registrar venda'}</button>`);
  if (document.getElementById('vbusca') && q) { const el = document.getElementById('vbusca'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
}
async function confirmarVenda() {
  const v = ui.venda; let nome = null, whats = null, cid = null;
  if (v.cliente === 'nova') { nome = (document.getElementById('vn-nome') || {}).value || ''; whats = (document.getElementById('vn-wa') || {}).value || ''; if (nome.trim().length < 2) { toast('Informe o nome da cliente', 'bad'); return; } }
  else if (v.cliente) cid = Number(v.cliente);
  else { toast('Escolha a cliente', 'bad'); return; }
  ui.ocupado = true; abrirFecharVenda();
  try {
    const pag = v.pag === 'cartao' ? 'cartao' : 'vista';
    const r = await sb().rpc('registrar_venda', { p_loja: ctx.lojaId, p_cliente_id: cid, p_cliente_nome: nome, p_cliente_whatsapp: whats, p_pagamento: pag, p_parcelas: pag === 'cartao' ? v.parc : 1,
      p_itens: ui.carrinho.map(c => { const p = prodId(c.id); return { produto_id: c.id, qtd: c.qtd, preco: pag === 'cartao' ? cartao(c.preco) : c.preco }; }), p_forma: v.pag });
    if (r.error) throw r.error;
    ui.carrinho = []; ui.venda = null; ui.ocupado = false;
    await carregar(); render();
    const c = cliId(r.data.cliente_id);
    abrirSheet(`<div class="sheet-head"><div><span class="eyebrow">Venda #${r.data.numero}</span><h2>Venda registrada</h2></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
      <div class="kv"><div><span>Total</span><b class="num">${brl(r.data.total)}</b></div><div><span>Lucro estimado</span><b class="num pos">${brl(r.data.lucro)}</b></div><div><span>Cliente</span><b>${esc(c ? c.nome : '')}</b></div></div>
      <p class="small muted">O estoque baixou e a venda entrou no caixa.</p>
      ${c && c.whatsapp ? `<button class="btn wa grande" data-act="whats" data-id="${c.id}" data-tipo="agradecimento">Agradecer no WhatsApp</button>` : ''}
      <button class="btn grande" data-act="fechar">Nova venda</button>`);
    bip(true); vibrar([30, 60, 30]);
  } catch (e) { ui.ocupado = false; abrirFecharVenda(); falha(e); }
}

/* ---------- CLIENTES ---------- */
function vClientes() {
  const q = ui.cq.trim().toLowerCase();
  if (ui.cfiltro === 'pos') return vPosVenda();
  let cs = D.clientes.map(c => ({ c, r: resumoCliente(c) })).filter(x => !q || (x.c.nome + ' ' + x.c.whatsapp + ' ' + x.c.instagram).toLowerCase().includes(q));
  if (ui.cfiltro === 'aniver') cs = cs.filter(x => { const d = proxAniversario(x.c); return d != null && d <= 31; }).sort((a, b) => proxAniversario(a.c) - proxAniversario(b.c));
  else if (ui.cfiltro === 'vip') cs = cs.filter(x => x.r.total > 0).sort((a, b) => b.r.total - a.r.total).slice(0, 20);
  else if (ui.cfiltro === 'ofertas') cs = cs.filter(x => x.c.aceita_ofertas && x.c.whatsapp);
  const F = [['todas', 'Todas'], ['pos', 'Pós-venda'], ['aniver', 'Aniversários'], ['vip', 'Que mais compram'], ['ofertas', 'Aceitam ofertas']];
  return `
  <div class="m-head"><div><span class="eyebrow">Relacionamento</span><h2>Clientes</h2></div><button class="btn primary" data-act="nova-cliente">+ Cliente</button></div>
  <div class="chips">${F.map(([k, l]) => `<button class="chip" data-act="cfiltro" data-k="${k}" aria-pressed="${ui.cfiltro === k}">${l}</button>`).join('')}</div>
  <div class="busca">${I.busca}<input id="cbusca" class="inp" type="search" placeholder="Buscar pelo nome, telefone ou Instagram" value="${esc(ui.cq)}" data-bind="cq" autocomplete="off"></div>
  <button class="btn" data-act="oferta">Enviar oferta para várias clientes</button>
  ${cs.length ? `<div class="lista">${cs.map(({ c, r }) => { const pa = proxAniversario(c);
    return `<button class="crow" data-act="cliente" data-id="${c.id}"><span class="av">${esc(iniciais(c.nome))}</span><span style="min-width:0"><b style="font-weight:500">${esc(c.nome)}</b><br><span class="small muted">${r.ultima ? 'última compra ' + dataBR(r.ultima).slice(0, 5) : 'ainda não comprou'}${pa != null && pa <= 31 ? ' · aniversário ' + (pa === 0 ? 'hoje' : 'em ' + pa + 'd') : ''}</span></span><span class="small num" style="text-align:right">${brl(r.total)}<br><span class="muted">${r.n} compra${r.n === 1 ? '' : 's'}</span></span></button>`; }).join('')}</div>`
    : `<div class="empty">${D.clientes.length ? 'Ninguém com esse filtro.' : 'Cadastre as suas clientes para mandar ofertas e lembrar dos aniversários.'}</div>`}`;
}
function vPosVenda() {
  const pv = posVenda(); const h = hoje();
  const bloco = (titulo, desc, itens, fn) => `<div class="card secao"><div><h3>${titulo} <span class="pill accent">${itens.length}</span></h3><span class="small muted">${desc}</span></div>${itens.length ? `<div>${itens.map(fn).join('')}</div>` : '<div class="empty" style="padding:10px">Ninguém por aqui hoje.</div>'}</div>`;
  return `
  <div class="m-head"><div><span class="eyebrow">Relacionamento</span><h2>Pós-venda</h2></div></div>
  <div class="chips">${[['todas', 'Todas'], ['pos', 'Pós-venda'], ['aniver', 'Aniversários'], ['vip', 'Que mais compram'], ['ofertas', 'Aceitam ofertas']].map(([k, l]) => `<button class="chip" data-act="cfiltro" data-k="${k}" aria-pressed="${ui.cfiltro === k}">${l}</button>`).join('')}</div>
  ${bloco('Agradecer', 'Compraram nos últimos 7 dias e ainda não receberam agradecimento.', pv.agradecer, x => tarefa(x.c, 'Comprou ' + (x.r.ultima === h ? 'hoje' : 'em ' + dataBR(x.r.ultima).slice(0, 5)) + ' · ' + brl(x.r.vs[0].total), 'agradecimento'))}
  ${bloco('Aniversários', 'Fazem aniversário nos próximos 7 dias.', pv.aniversario, x => tarefa(x.c, x.pa === 0 ? 'Hoje!' : 'Em ' + x.pa + ' dia' + (x.pa > 1 ? 's' : '') + ' · ' + dataBR(x.c.aniversario).slice(0, 5), 'aniversario'))}
  ${bloco('Sentindo falta', 'Não compram há mais de 60 dias. As que mais gastaram aparecem primeiro.', pv.saudade, x => tarefa(x.c, dias(x.r.ultima, h) + ' dias sem comprar · já gastou ' + brl(x.r.total), 'reativacao'))}
  <button class="btn" data-act="oferta">Enviar oferta para várias clientes</button>`;
}
function abrirCliente(c) {
  const r = resumoCliente(c); const novo = !c.id;
  abrirSheet(`
  <div class="sheet-head"><div><span class="eyebrow">${novo ? 'Cadastro' : 'Cliente'}</span><h2>${novo ? 'Nova cliente' : esc(c.nome)}</h2></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
  ${novo ? '' : `<div class="g2"><div class="stat"><span class="lbl">Já gastou</span><span class="val num">${brl(r.total)}</span><span class="sub">${r.n} compra${r.n === 1 ? '' : 's'}</span></div><div class="stat"><span class="lbl">Última compra</span><span class="val">${r.ultima ? dataBR(r.ultima).slice(0, 5) : '—'}</span><span class="sub">${r.ultima ? dias(r.ultima, hoje()) + ' dias atrás' : ''}</span></div></div>
  ${c.whatsapp ? `<div class="dois"><button class="btn wa" data-act="whats" data-id="${c.id}" data-tipo="agradecimento">Agradecer</button><button class="btn wa" data-act="whats" data-id="${c.id}" data-tipo="reativacao">Mostrar novidades</button></div>` : ''}`}
  <form id="form-cliente" class="grid" data-id="${c.id || ''}">
    <div class="field"><label for="cl-nome">Nome</label><input id="cl-nome" class="inp" value="${esc(c.nome || '')}" maxlength="80" required></div>
    <div class="dois"><div class="field"><label for="cl-wa">WhatsApp</label><input id="cl-wa" class="inp" inputmode="tel" value="${esc(fone(c.whatsapp))}" placeholder="31 90000-0000"></div><div class="field"><label for="cl-aniv">Aniversário</label><input id="cl-aniv" class="inp" type="date" value="${esc(c.aniversario || '')}"></div></div>
    <div class="field"><label for="cl-ig">Instagram</label><input id="cl-ig" class="inp" value="${esc(c.instagram || '')}" maxlength="40" placeholder="@cliente"></div>
    <div class="field"><label for="cl-obs">Gosta de</label><textarea id="cl-obs" class="inp" maxlength="500" placeholder="Ex.: prefere dourado, argolas grandes, aro 16">${esc(c.observacoes || '')}</textarea></div>
    <label class="check"><input type="checkbox" id="cl-ok" ${c.aceita_ofertas !== false ? 'checked' : ''}> <span>Ela aceita receber ofertas pelo WhatsApp</span></label>
    <button class="btn primary" type="submit">${novo ? 'Cadastrar cliente' : 'Salvar'}</button>
  </form>
  ${novo ? '' : `<div class="grid"><h3>Compras</h3>${r.vs.length ? `<div class="lista">${r.vs.slice(0, 10).map(v => `<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto"><span class="t"><b>${dataBR(v.data)} · #${v.numero}</b><span>${v.venda_itens.map(i => i.qtd + '× ' + esc((prodId(i.produto_id) || {}).nome || 'peça')).join(', ')}</span></span><span class="num">${brl(v.total)}</span></div>`).join('')}</div>` : '<div class="empty">Nenhuma compra ainda.</div>'}
    ${r.contatos.length ? `<h3>Contatos</h3><div class="lista">${r.contatos.slice(0, 8).map(x => `<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto"><span class="t"><b>${({ agradecimento: 'Agradecimento', oferta: 'Oferta', aniversario: 'Aniversário', reativacao: 'Novidades', outro: 'Contato' })[x.tipo]}</b><span>${esc(x.mensagem.slice(0, 80))}</span></span><span class="small muted">${dataBR(x.criado_em.slice(0, 10)).slice(0, 5)}</span></div>`).join('')}</div>` : ''}</div>`}`);
}

/* ---------- ofertas para várias clientes ---------- */
function abrirOferta(pecaId) {
  ui.of = ui.of || { publico: 'todas', pecas: pecaId ? [pecaId] : [], texto: '', enviadas: [] };
  if (pecaId && !ui.of.pecas.includes(pecaId)) ui.of.pecas.push(pecaId);
  const o = ui.of;
  const linhas = o.pecas.map(id => prodId(id)).filter(Boolean).map(p => `• ${p.nome}: ${brl(vista(p))} à vista`).join('\n');
  if (!o.texto) o.texto = `Oi, {nome}! Chegaram novidades na ${D.loja.nome} e lembrei de você:\n\n${linhas || '• (escolha as peças abaixo)'}\n\nQuer que eu separe alguma para você?`;
  const pv = posVenda();
  const P = { todas: D.clientes, saudade: pv.saudade.map(x => x.c), aniver: D.clientes.filter(c => { const d = proxAniversario(c); return d != null && d <= 31; }), vip: D.clientes.map(c => ({ c, t: resumoCliente(c).total })).filter(x => x.t > 0).sort((a, b) => b.t - a.t).slice(0, 20).map(x => x.c) };
  const lista = (P[o.publico] || []).filter(c => c.aceita_ofertas && c.whatsapp);
  const disp = D.produtos.filter(p => p.estoque > 0);
  abrirSheet(`
  <div class="sheet-head"><div><span class="eyebrow">Oferta</span><h2>Mandar novidades</h2></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
  <div class="field"><span class="flabel">Peças da oferta</span><div class="chips" style="flex-wrap:wrap">${disp.slice(0, 40).map(p => `<button class="chip" data-act="of-peca" data-id="${p.id}" aria-pressed="${o.pecas.includes(p.id)}">${esc(p.nome)}</button>`).join('') || '<span class="small muted">Nenhuma peça em estoque.</span>'}</div></div>
  <div class="field"><label for="of-texto">Mensagem ({nome} vira o primeiro nome da cliente)</label><textarea id="of-texto" class="inp" data-bind="oftexto" maxlength="900">${esc(o.texto)}</textarea><button class="btn sm ghost" data-act="of-refazer" style="justify-self:start">Refazer texto com as peças escolhidas</button></div>
  <div class="field"><span class="flabel">Para quem</span><div class="chips">${[['todas', 'Todas'], ['vip', 'Que mais compram'], ['aniver', 'Aniversariantes do mês'], ['saudade', 'Sumidas há 60 dias']].map(([k, l]) => `<button class="chip" data-act="of-pub" data-k="${k}" aria-pressed="${o.publico === k}">${l}</button>`).join('')}</div></div>
  <p class="small muted">${lista.length} cliente${lista.length === 1 ? '' : 's'} com WhatsApp que aceitam ofertas. O WhatsApp abre uma conversa por vez; toque em cada nome e depois em enviar.</p>
  <div class="lista">${lista.map(c => { const env = o.enviadas.includes(c.id); return `<div class="tarefa"><div class="t"><b>${esc(c.nome)}</b><span>${fone(c.whatsapp)}</span></div>${env ? '<span class="pill good">enviada</span>' : `<button class="btn sm wa" data-act="of-enviar" data-id="${c.id}">Enviar</button>`}</div>`; }).join('') || '<div class="empty">Ninguém neste grupo.</div>'}</div>`);
}

/* ---------- CAIXA ---------- */
const CAT_E = ['Venda', 'Outros recebimentos', 'Aporte'];
const CAT_S = ['Compra de mercadoria', 'Embalagem', 'Frete', 'Aluguel', 'Marketing', 'Taxas', 'Salários', 'Retirada', 'Outros'];
const FORMAS = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão', boleto: 'Boleto', outro: 'Outro' };
function vCaixa() {
  const ls = D.lanc; const ent = ls.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0), sai = ls.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);
  const porDia = {}; ls.forEach(l => (porDia[l.data] = porDia[l.data] || []).push(l));
  const cats = {}; ls.filter(l => l.tipo === 'saida').forEach(l => cats[l.categoria] = (cats[l.categoria] || 0) + l.valor);
  const topCats = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 4);
  return `
  <div class="m-head"><div><span class="eyebrow">Fluxo de caixa</span><h2>${mesNome(ui.caixaMes).replace(/^./, c => c.toUpperCase())}</h2></div>
    <div class="acoes"><button class="m-icon" data-act="mes" data-k="-1" aria-label="Mês anterior">‹</button><button class="m-icon" data-act="mes" data-k="1" aria-label="Próximo mês" ${ui.caixaMes >= hoje().slice(0, 7) ? 'disabled' : ''}>›</button></div></div>
  <div class="stat"><span class="lbl">Saldo do mês</span><span class="val num ${ent - sai >= 0 ? 'pos' : 'neg'}" style="font-size:2rem">${brl(ent - sai)}</span></div>
  <div class="g2"><div class="stat"><span class="lbl">Entrou</span><span class="val num pos">${brl(ent)}</span></div><div class="stat"><span class="lbl">Saiu</span><span class="val num neg">${brl(sai)}</span></div></div>
  ${topCats.length ? `<div class="card grid"><h3>Para onde foi o dinheiro</h3>${topCats.map(([c, v]) => `<div style="display:grid;gap:4px"><div class="secao-t small"><span>${esc(c)}</span><span class="num">${brl(v)}</span></div><span style="height:4px;border-radius:2px;background:var(--surface-2);overflow:hidden"><span style="display:block;height:100%;width:${v / sai * 100}%;background:linear-gradient(90deg,var(--gold),var(--accent))"></span></span></div>`).join('')}</div>` : ''}
  <div class="dois"><button class="btn primary" data-act="lancar" data-k="entrada">+ Entrada</button><button class="btn" data-act="lancar" data-k="saida">− Saída</button></div>
  ${ls.length ? Object.keys(porDia).map(d => `<div><div class="dia">${diaBR(d)}</div><div class="lista">${porDia[d].map(l => `<button class="lanc" data-act="lanc" data-id="${l.id}"><span class="av ${l.tipo === 'entrada' ? 'e' : 's'}">${l.tipo === 'entrada' ? '+' : '−'}</span><span style="min-width:0"><b style="font-weight:500">${esc(l.categoria)}</b><br><span class="small muted">${esc(l.descricao || FORMAS[l.forma])}</span></span><span class="num ${l.tipo === 'entrada' ? 'pos' : 'neg'}">${l.tipo === 'entrada' ? '' : '−'}${brl(l.valor)}</span></button>`).join('')}</div></div>`).join('')
    : '<div class="empty">Nada lançado neste mês. As vendas entram aqui sozinhas.</div>'}`;
}
function abrirLancamento(tipo, l) {
  const ed = !!l; tipo = l ? l.tipo : tipo; const cats = tipo === 'entrada' ? CAT_E : CAT_S;
  const travado = l && (l.venda_id || l.nota_id);
  ui.lc = { tipo, cat: l ? l.categoria : (tipo === 'entrada' ? 'Outros recebimentos' : 'Compra de mercadoria'), forma: l ? l.forma : 'pix' };
  abrirSheet(`
  <div class="sheet-head"><div><span class="eyebrow">${tipo === 'entrada' ? 'Entrada' : 'Saída'}</span><h2>${ed ? esc(l.categoria) : tipo === 'entrada' ? 'Dinheiro que entrou' : 'Dinheiro que saiu'}</h2></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
  ${travado ? `<div class="alert warn small"><span>Lançado automaticamente por ${l.venda_id ? 'uma venda' : 'uma nota fiscal'}. Para corrigir, ajuste no sistema completo.</span></div>
    <div class="kv"><div><span>Valor</span><b class="num">${brl(l.valor)}</b></div><div><span>Data</span><b>${dataBR(l.data)}</b></div><div><span>Forma</span><b>${FORMAS[l.forma]}</b></div><div><span>Descrição</span><b>${esc(l.descricao)}</b></div></div>` : `
  <form id="form-lanc" class="grid" data-id="${l ? l.id : ''}">
    <div class="field"><label for="lc-valor">Valor (R$)</label><input id="lc-valor" class="inp num" inputmode="decimal" style="font-size:1.6rem;font-family:var(--f-display);font-weight:300" value="${l ? String(l.valor).replace('.', ',') : ''}" placeholder="0,00" required></div>
    <div class="field"><span class="flabel">Categoria</span><div class="chips" style="flex-wrap:wrap" id="lc-cats">${cats.filter(c => c !== 'Venda').map(c => `<button type="button" class="chip" data-act="lc-cat" data-k="${esc(c)}" aria-pressed="${ui.lc.cat === c}">${esc(c)}</button>`).join('')}</div></div>
    <div class="field"><span class="flabel">Forma</span><div class="chips" id="lc-formas">${Object.entries(FORMAS).map(([k, v]) => `<button type="button" class="chip" data-act="lc-forma" data-k="${k}" aria-pressed="${ui.lc.forma === k}">${v}</button>`).join('')}</div></div>
    <div class="dois"><div class="field"><label for="lc-data">Data</label><input id="lc-data" class="inp" type="date" value="${l ? l.data : hoje()}" max="${hoje()}"></div><div class="field"><label for="lc-desc">Descrição</label><input id="lc-desc" class="inp" maxlength="120" value="${esc(l ? l.descricao : '')}" placeholder="opcional"></div></div>
    <button class="btn primary grande" type="submit">${ed ? 'Salvar' : 'Lançar'}</button>
    ${ed && dona() ? `<button class="btn danger" type="button" data-act="lc-apagar" data-id="${l.id}">Apagar lançamento</button>` : ''}
  </form>`}`);
}

/* ---------- NOTA FISCAL ---------- */
function abrirNota() {
  ui.nota = null;
  abrirSheet(`
  <div class="sheet-head"><div><span class="eyebrow">Entrada de mercadoria</span><h2>Importar nota fiscal</h2></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
  <p class="muted">Escolha o arquivo <b>XML</b> da NF-e que o fornecedor mandou por e-mail. O EstoqueOn lê os itens, sugere qual peça é cada um, dá entrada no estoque e lança a compra no caixa.</p>
  <label class="btn primary grande" style="position:relative">Escolher arquivo XML<input type="file" id="nota-in" accept=".xml,text/xml,application/xml" style="position:absolute;inset:0;opacity:0"></label>
  <p class="small muted">Só tem o PDF (DANFE) ou a foto da nota? Peça o XML ao fornecedor: toda NF-e tem um, e ele traz os itens sem erro de digitação.</p>`);
}
async function lerNota(file) {
  try {
    const txt = await file.text();
    const n = NFe.lerNFe(txt);
    if (!/^\d{44}$/.test(n.chave)) throw new Error('Não encontrei a chave de acesso da nota.');
    if (!n.itens.length) throw new Error('A nota não tem itens.');
    const sug = NFe.associar(n.itens, D.produtos);
    ui.nota = { n, itens: n.itens.map((it, i) => ({ ...it, qtd: Math.max(1, Math.round(it.qtd)), destino: sug[i].produto ? String(sug[i].produto.id) : 'novo', motivo: sug[i].motivo, nome: NFe.nomeAmigavel(it.descricao), categoria: NFe.categoria(it.descricao) })), atualizar: true, caixa: true };
    const ja = await sb().from('notas').select('id').eq('loja_id', ctx.lojaId).eq('chave', n.chave).maybeSingle();
    if (ja.data) toast('Atenção: esta nota já foi importada antes.', 'bad');
    renderNota();
  } catch (e) { falha(e); }
}
function renderNota() {
  const { n, itens } = ui.nota; const opcoes = D.produtos.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  const usados = itens.filter(i => i.destino !== 'ignorar'); const pecas = usados.reduce((s, i) => s + i.qtd, 0);
  abrirSheet(`
  <div class="sheet-head"><div><span class="eyebrow">NF ${esc(n.numero)} · ${dataBR(n.emissao)}</span><h2>${esc(n.fornecedor)}</h2></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
  <div class="kv"><div><span>Valor da nota</span><b class="num">${brl(n.valor_total)}</b></div><div><span>Itens</span><b>${itens.length}</b></div><div class="small muted" style="display:block;overflow-wrap:anywhere">Chave ${esc(n.chave)}</div></div>
  ${itens.map((it, i) => `<div class="nota-item ${it.destino === 'ignorar' ? 'ignorado' : ''}">
    <div class="linha"><span><b style="font-weight:500">${esc(it.descricao)}</b><br><span class="small muted">cód. ${esc(it.codigo)}${it.ean ? ' · EAN ' + esc(it.ean) : ''} · ${brl(it.custo)} un.</span></span>
      <div class="passo"><button type="button" data-act="nq" data-i="${i}" data-q="-1">−</button><span class="num">${it.qtd}</span><button type="button" data-act="nq" data-i="${i}" data-q="1">+</button></div></div>
    <select id="nd-${i}" class="inp" data-bind="ndest" data-i="${i}"><option value="novo" ${it.destino === 'novo' ? 'selected' : ''}>+ Criar peça nova</option><option value="ignorar" ${it.destino === 'ignorar' ? 'selected' : ''}>Não dar entrada neste item</option><optgroup label="Associar a uma peça">${opcoes.map(p => `<option value="${p.id}" ${it.destino === String(p.id) ? 'selected' : ''}>${esc(p.nome)} (${esc(p.sku)})</option>`).join('')}</optgroup></select>
    ${it.destino === 'novo' ? `<div class="dois"><input id="nn-${i}" class="inp" value="${esc(it.nome)}" data-bind="nnome" data-i="${i}" maxlength="80" aria-label="Nome da peça nova"><input id="nc-${i}" class="inp" value="${esc(it.categoria)}" data-bind="ncat" data-i="${i}" maxlength="40" placeholder="Categoria" aria-label="Categoria"></div>`
      : it.destino !== 'ignorar' && it.motivo && String((NFe.associar([it], D.produtos)[0].produto || {}).id) === it.destino ? `<span class="match pos">Associado pelo ${it.motivo}</span>` : ''}
  </div>`).join('')}
  <label class="check"><input type="checkbox" id="n-atual" ${ui.nota.atualizar ? 'checked' : ''} data-bind="natual"> <span>Atualizar o custo das peças com o valor desta nota</span></label>
  <label class="check"><input type="checkbox" id="n-caixa" ${ui.nota.caixa ? 'checked' : ''} data-bind="ncaixa"> <span>Lançar ${brl(n.valor_total)} no caixa como compra de mercadoria</span></label>
  <button class="btn primary grande" data-act="nota-ok" ${!usados.length || ui.ocupado ? 'disabled' : ''}>${ui.ocupado ? 'Importando…' : `Dar entrada em ${pecas} peça${pecas === 1 ? '' : 's'}`}</button>`);
}
async function confirmarNota() {
  const { n, itens } = ui.nota;
  const sel = itens.filter(i => i.destino !== 'ignorar').map(i => {
    const base = { qtd: i.qtd, custo: i.custo, codigo: i.codigo, descricao: i.descricao, ean: i.ean };
    return i.destino === 'novo' ? { ...base, novo: { nome: i.nome.trim() || NFe.nomeAmigavel(i.descricao), categoria: i.categoria, sku_fornecedor: i.codigo, ean: i.ean } } : { ...base, produto_id: Number(i.destino) };
  });
  ui.ocupado = true; renderNota();
  try {
    const r = await sb().rpc('importar_nota', { p_loja: ctx.lojaId, p_nota: { chave: n.chave, numero: n.numero, fornecedor: n.fornecedor, cnpj: n.cnpj, emissao: n.emissao, valor_total: n.valor_total }, p_itens: sel, p_atualizar_custo: ui.nota.atualizar, p_lancar_caixa: ui.nota.caixa });
    if (r.error) throw r.error;
    ui.ocupado = false; fecharSheet(); await carregar(); render();
    toast(`Nota importada: ${r.data.pecas} peças no estoque${r.data.criadas ? ', ' + r.data.criadas + ' peça(s) nova(s)' : ''}`, 'good');
  } catch (e) { ui.ocupado = false; renderNota(); falha(e); }
}

/* ---------- folha (sheet) ---------- */
function abrirSheet(html) {
  const s = document.getElementById('sheet'), f = document.getElementById('sheet-fundo');
  const topo = s.hidden ? 0 : s.scrollTop;
  s.innerHTML = '<span class="alca" aria-hidden="true"></span>' + html; s.hidden = false; f.hidden = false; s.scrollTop = topo;
  document.body.style.overflow = 'hidden';
}
function fecharSheet() {
  document.getElementById('sheet').hidden = true; document.getElementById('sheet-fundo').hidden = true; document.body.style.overflow = '';
  ui.venda = null; ui.of = null; ui.nota = null;
}
function desenharQR() {
  document.querySelectorAll('[data-qr]').forEach(el => { if (el.dataset.done || !window.QRCode) return; el.dataset.done = '1'; try { new QRCode(el, { text: el.dataset.qr, width: 280, height: 280, correctLevel: QRCode.CorrectLevel.M }); } catch (e) {} });
}
function abrirMenu() {
  abrirSheet(`
  <div class="sheet-head"><div><span class="eyebrow">Conta</span><h2>${esc(ctx.perfil.nome || ctx.user.email)}</h2><span class="small muted">${esc(ctx.user.email)} · ${dona() ? 'dona' : 'vendedora'}</span></div><button class="m-icon" data-act="fechar" aria-label="Fechar">✕</button></div>
  ${ctx.lojas.length > 1 ? `<div class="grid"><h3>Trocar de loja</h3><div class="lista">${ctx.lojas.map(x => `<button class="crow" data-act="trocar-loja" data-id="${x.loja.id}"><span class="av">${esc(iniciais(x.loja.nome))}</span><span><b style="font-weight:500">${esc(x.loja.nome)}</b></span><span>${x.loja.id === ctx.lojaId ? '<span class="pill accent">aberta</span>' : ''}</span></button>`).join('')}</div></div>` : ''}
  <a class="btn" href="app.html">Abrir o sistema completo</a>
  ${ctx.master ? '<a class="btn" href="master.html">Painel master</a>' : ''}
  <p class="small muted">Para instalar: no Android, menu do Chrome → <b>Instalar app</b>. No iPhone, Safari → Compartilhar → <b>Adicionar à Tela de Início</b>.</p>
  <button class="btn danger" data-act="sair">Sair</button>`);
}

/* ---------- eventos ---------- */
const A = {
  tab: b => { if (b.dataset.cf) ui.cfiltro = b.dataset.cf; irPara(b.dataset.k); },
  'ir-pos': () => { ui.cfiltro = 'pos'; irPara('clientes'); },
  menu: () => abrirMenu(),
  fechar: () => fecharSheet(),
  sair: () => { pararCamera(); EO.sair(); },
  'trocar-loja': async b => { ctx.lojaId = b.dataset.id; ctx.papel = ctx.lojas.find(x => x.loja.id === ctx.lojaId).papel; gravar('loja', ctx.lojaId); fecharSheet(); ui.carrinho = []; ui.feed = []; await atualizar(); },
  vista: b => { ui.vista = b.dataset.k; gravar('vista', ui.vista); render(); },
  filtro: b => { ui.filtro = b.dataset.k; render(); },
  produto: b => abrirProduto(prodId(Number(b.dataset.id))),
  'nova-peca': () => abrirNovaPeca(),
  nota: () => abrirNota(),
  ajuste: async b => { const p = prodId(Number(b.dataset.id)); const q = Number(b.dataset.q); if (q < 0 && p.estoque <= 0) return toast('O estoque já está zerado', 'bad'); b.disabled = true; await mover(p, q, q > 0 ? 'Entrada manual (celular)' : 'Saída manual (celular)'); abrirProduto(p); },
  'add-carrinho': b => { const p = prodId(Number(b.dataset.id)); if (p.estoque <= 0) return toast('Sem estoque', 'bad'); const c = ui.carrinho.find(x => x.id === p.id); if (c) c.qtd++; else ui.carrinho.push({ id: p.id, qtd: 1, preco: vista(p) }); ui.modo = 'venda'; fecharSheet(); irPara('leitor'); },
  'oferta-peca': b => { const id = Number(b.dataset.id); ui.of = null; abrirOferta(id); },
  modo: b => { ui.modo = b.dataset.k; gravar('modo', ui.modo); render(); },
  camera: () => abrirCamera(),
  bipar: () => { const i = document.getElementById('codigo'); const v = i.value; i.value = ''; lido(v); },
  desfazer: async () => { const f = ui.feed[0]; if (!f || f.desfeito) return; const p = prodId(f.id); f.desfeito = true; await mover(p, -f.q, 'Leitura desfeita'); toast('Leitura desfeita'); },
  cq: b => { const c = ui.carrinho.find(x => x.id === Number(b.dataset.id)); const p = prodId(c.id); c.qtd += Number(b.dataset.q); if (c.qtd > p.estoque) { c.qtd = p.estoque; toast('Só há ' + p.estoque + ' em estoque', 'bad'); } if (c.qtd <= 0) ui.carrinho = ui.carrinho.filter(x => x !== c); render(); },
  esvaziar: () => { ui.carrinho = []; render(); },
  'fechar-venda': () => { ui.venda = null; abrirFecharVenda(); },
  vpag: b => { ui.venda.pag = b.dataset.k; abrirFecharVenda(); },
  vparc: b => { ui.venda.parc = Number(b.dataset.k); abrirFecharVenda(); },
  vcli: b => { ui.venda.cliente = b.dataset.k; ui.venda.busca = ''; abrirFecharVenda(); },
  'confirmar-venda': () => confirmarVenda(),
  whats: async b => { const c = cliId(Number(b.dataset.id)); const t = b.dataset.tipo; if (await enviarWhats(c, t, msg(t, c))) { toast('Contato registrado'); if (!document.getElementById('sheet').hidden && document.getElementById('form-cliente')) abrirCliente(c); render(); } },
  cfiltro: b => { ui.cfiltro = b.dataset.k; render(); },
  'nova-cliente': () => abrirCliente({ aceita_ofertas: true }),
  cliente: b => abrirCliente(cliId(Number(b.dataset.id))),
  oferta: () => { ui.of = null; abrirOferta(); },
  'of-peca': b => { const id = Number(b.dataset.id); const o = ui.of; o.pecas = o.pecas.includes(id) ? o.pecas.filter(x => x !== id) : [...o.pecas, id]; abrirOferta(); },
  'of-refazer': () => { ui.of.texto = ''; abrirOferta(); },
  'of-pub': b => { ui.of.publico = b.dataset.k; abrirOferta(); },
  'of-enviar': async b => { const c = cliId(Number(b.dataset.id)); if (await enviarWhats(c, 'oferta', msg('oferta', c, ui.of.texto))) { ui.of.enviadas.push(c.id); abrirOferta(); } },
  mes: async b => { ui.caixaMes = Number(b.dataset.k) > 0 ? proxMes(ui.caixaMes) : antMes(ui.caixaMes); await recarregarCaixa(); },
  lancar: b => abrirLancamento(b.dataset.k),
  lanc: b => abrirLancamento(null, D.lanc.find(l => l.id === Number(b.dataset.id))),
  'lc-cat': b => { ui.lc.cat = b.dataset.k; document.querySelectorAll('#lc-cats .chip').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === ui.lc.cat)); },
  'lc-forma': b => { ui.lc.forma = b.dataset.k; document.querySelectorAll('#lc-formas .chip').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === ui.lc.forma)); },
  'lc-apagar': async b => { if (b.dataset.confirma !== '1') { b.dataset.confirma = '1'; b.textContent = 'Confirmar: apagar'; return; } const r = await sb().from('lancamentos').delete().eq('id', Number(b.dataset.id)); if (r.error) return falha(r.error); fecharSheet(); toast('Lançamento apagado'); recarregarCaixa(); },
  nq: b => { const it = ui.nota.itens[Number(b.dataset.i)]; it.qtd = Math.max(1, it.qtd + Number(b.dataset.q)); renderNota(); },
  'nota-ok': () => confirmarNota()
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const f = A[b.dataset.act]; if (f) { e.preventDefault(); f(b, e); }
});
document.getElementById('sheet-fundo').addEventListener('click', fecharSheet);
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'codigo') { e.preventDefault(); A.bipar(); }
  if (e.key === 'Escape' && !document.getElementById('sheet').hidden) fecharSheet();
});
document.addEventListener('input', e => {
  const t = e.target, k = t.dataset.bind; if (!k) { if (t.closest('#form-nova')) prevNova(); return; }
  if (k === 'q') { ui.q = t.value; render(); }
  else if (k === 'cq') { ui.cq = t.value; render(); }
  else if (k === 'vbusca') { ui.venda.busca = t.value; abrirFecharVenda(); }
  else if (k === 'oftexto') ui.of.texto = t.value;
  else if (k === 'nnome') ui.nota.itens[Number(t.dataset.i)].nome = t.value;
  else if (k === 'ncat') ui.nota.itens[Number(t.dataset.i)].categoria = t.value;
});
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset.bind;
  if (t.id === 'foto-in') { enviarFoto(t.files && t.files[0], Number(t.dataset.id)); return; }
  if (t.id === 'nota-in') { if (t.files && t.files[0]) lerNota(t.files[0]); return; }
  if (k === 'ndest') { ui.nota.itens[Number(t.dataset.i)].destino = t.value; renderNota(); }
  else if (k === 'natual') ui.nota.atualizar = t.checked;
  else if (k === 'ncaixa') ui.nota.caixa = t.checked;
});
function prevNova() {
  const c = numIn(document.getElementById('np-custo').value); const box = document.getElementById('np-prev');
  if (box) box.innerHTML = `<div><span>Preço calculado à vista</span><b class="num">${c ? brl(calcVista({ custo: c })) : '—'}</b></div><div><span>No cartão</span><b class="num">${c ? brl(cartao(calcVista({ custo: c }))) : '—'}</b></div>`;
}
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  const btn = f.querySelector('[type=submit]'); if (btn) btn.disabled = true;
  try {
    if (f.id === 'form-cliente') {
      const dados = { nome: document.getElementById('cl-nome').value.trim(), whatsapp: document.getElementById('cl-wa').value.replace(/\D/g, '').slice(0, 13), aniversario: document.getElementById('cl-aniv').value || null,
        instagram: document.getElementById('cl-ig').value.trim(), observacoes: document.getElementById('cl-obs').value.trim(), aceita_ofertas: document.getElementById('cl-ok').checked };
      if (dados.nome.length < 2) throw new Error('Informe o nome da cliente.');
      if (dados.whatsapp && dados.whatsapp.length < 10) throw new Error('Informe o WhatsApp com DDD.');
      const id = f.dataset.id;
      const r = id ? await sb().from('clientes').update(dados).eq('id', Number(id)).select().single() : await sb().from('clientes').insert({ ...dados, loja_id: ctx.lojaId }).select().single();
      if (r.error) throw r.error;
      if (id) Object.assign(cliId(Number(id)), r.data); else D.clientes.push(r.data);
      D.clientes.sort((a, b) => a.nome.localeCompare(b.nome));
      toast(id ? 'Cliente salva' : 'Cliente cadastrada', 'good'); abrirCliente(r.data); render();
    } else if (f.id === 'form-lanc') {
      const valor = numIn(document.getElementById('lc-valor').value); if (!(valor > 0)) throw new Error('Informe o valor.');
      const dados = { tipo: ui.lc.tipo, categoria: ui.lc.cat, forma: ui.lc.forma, valor, data: document.getElementById('lc-data').value || hoje(), descricao: document.getElementById('lc-desc').value.trim() };
      const id = f.dataset.id;
      const r = id ? await sb().from('lancamentos').update(dados).eq('id', Number(id)) : await sb().from('lancamentos').insert({ ...dados, loja_id: ctx.lojaId });
      if (r.error) throw r.error;
      fecharSheet(); toast(id ? 'Lançamento salvo' : 'Lançado no caixa', 'good');
      ui.caixaMes = dados.data.slice(0, 7); await recarregarCaixa();
    } else if (f.id === 'form-peca') {
      const p = prodId(Number(f.dataset.id)); const pr = document.getElementById('pp-preco').value.trim();
      const dados = { nome: document.getElementById('pp-nome').value.trim(), categoria: document.getElementById('pp-cat').value.trim(), estoque_minimo: Math.max(0, Math.round(numIn(document.getElementById('pp-min').value))),
        custo: Math.max(0, numIn(document.getElementById('pp-custo').value)), preco: pr ? Math.max(0, numIn(pr)) : null, fornecedor: document.getElementById('pp-forn').value.trim(),
        sku_fornecedor: document.getElementById('pp-skuf').value.trim(), ean: document.getElementById('pp-ean').value.replace(/\D/g, '') };
      if (!dados.nome) throw new Error('Dê um nome à peça.');
      const r = await sb().from('produtos').update(dados).eq('id', p.id); if (r.error) throw r.error;
      Object.assign(p, dados, { skuF: dados.sku_fornecedor }); toast('Peça salva', 'good'); abrirProduto(p); render();
    } else if (f.id === 'form-nova') {
      const nome = document.getElementById('np-nome').value.trim(); const custo = numIn(document.getElementById('np-custo').value); const qtd = Math.max(0, Math.round(numIn(document.getElementById('np-qtd').value)));
      if (!nome) throw new Error('Dê um nome à peça.');
      const cod = document.getElementById('np-skuf').value.trim();
      const n = D.produtos.reduce((m, x) => { const k = parseInt(String(x.sku).replace(/\D/g, ''), 10); return isFinite(k) ? Math.max(m, k) : m; }, 0) + 1;
      const r = await sb().from('produtos').insert({ loja_id: ctx.lojaId, sku: 'EO-' + String(n).padStart(4, '0'), nome, categoria: document.getElementById('np-cat').value.trim(), fornecedor: document.getElementById('np-forn').value.trim(),
        custo, sku_fornecedor: /^\d{8,14}$/.test(cod) ? '' : cod, ean: /^\d{8,14}$/.test(cod) ? cod : '' }).select('id').single();
      if (r.error) throw r.error;
      if (qtd > 0) { const m = await sb().from('movimentos').insert({ loja_id: ctx.lojaId, produto_id: r.data.id, tipo: 'entrada', qtd, ref: 'Estoque inicial' }); if (m.error) throw m.error; }
      fecharSheet(); toast('Peça cadastrada', 'good'); await carregar(); render(); abrirProduto(prodId(r.data.id));
    }
  } catch (err) { falha(err); }
  if (btn) btn.disabled = false;
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pararCamera(); else if (ui.tab === 'leitor' && ler('camera', '0') === '1') abrirCamera(); });

/* ---------- início ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  try {
    const s = await EO.exigirSessao(); if (!s) return;
    ctx.user = s.user;
    sb().auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') location.replace('entrar.html'); });
    await carregarContexto();
    EO.vigiarSessao();
    if (!ctx.lojaId) { document.getElementById('view').innerHTML = '<div class="empty"><h2>Sem loja</h2><p>Sua conta ainda não está em nenhuma loja.</p></div>'; return; }
    const x = ctx.lojas.find(l => l.loja.id === ctx.lojaId);
    if (!x.loja.ativa) { document.getElementById('view').innerHTML = '<div class="empty"><h2>Loja suspensa</h2><p>Fale no WhatsApp (31) 97310-9443.</p></div>'; return; }
    await carregar(); render();
  } catch (e) {
    console.error(e);
    document.getElementById('view').innerHTML = `<div class="empty"><h2>Não foi possível abrir</h2><p>${esc(traduz(e))}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></div>`;
  }
});
})();
