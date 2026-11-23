// EstoqueOn — painel master: todas as lojas, planos, situação e histórico geral.
(function () {
'use strict';
const sb = () => EO.cliente();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataHora = iso => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const TAB = { lojas: 'loja', membros: 'equipe', convites: 'convite', insumos: 'insumo', produtos: 'peça', clientes: 'cliente', vendas: 'venda', venda_itens: 'item de venda', movimentos: 'estoque', masters: 'master' };
const ACAO = { INSERT: 'criou', UPDATE: 'alterou', DELETE: 'excluiu' };
let st = { lojas: [], planos: [], aud: [], filtroLoja: '', q: '' };

function toast(msg, kind) { const box = document.getElementById('toast'); const el = document.createElement('div'); el.className = 't' + (kind ? ' ' + kind : ''); el.textContent = msg; box.appendChild(el); setTimeout(() => el.remove(), 3500); }

async function carregar() {
  const [l, p] = await Promise.all([sb().rpc('master_lojas'), sb().from('planos').select('*').order('ordem')]);
  if (l.error) throw l.error;
  st.lojas = l.data; st.planos = p.data || [];
  await carregarAud();
}
async function carregarAud() {
  let q = sb().from('auditoria').select('*').order('em', { ascending: false }).limit(100);
  if (st.filtroLoja) q = q.eq('loja_id', st.filtroLoja);
  const r = await q; if (r.error) throw r.error; st.aud = r.data;
}

function render() {
  const q = st.q.trim().toLowerCase();
  const ls = st.lojas.filter(l => !q || (l.nome + ' ' + (l.dona_email || '')).toLowerCase().includes(q));
  const ativas = st.lojas.filter(l => l.ativa);
  const mrr = ativas.reduce((s, l) => s + Number((st.planos.find(p => p.id === l.plano) || {}).preco_mensal || 0), 0);
  const nome = id => (st.lojas.find(l => l.id === id) || {}).nome || '—';
  document.getElementById('view').innerHTML = `
  <div class="head"><div><span class="eyebrow">Administração</span><h2>Lojas no EstoqueOn</h2></div></div>
  <div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
    <div class="kpi"><div class="lbl">Lojas ativas</div><div class="val num">${ativas.length}</div><div class="sub">${st.lojas.length - ativas.length} suspensa(s)</div></div>
    <div class="kpi"><div class="lbl">Receita mensal</div><div class="val num">${brl(mrr)}</div><div class="sub">pela tabela dos planos</div></div>
    ${st.planos.map(p => `<div class="kpi"><div class="lbl">Plano ${esc(p.nome)}</div><div class="val num">${ativas.filter(l => l.plano === p.id).length}</div><div class="sub">${brl(p.preco_mensal)}/mês</div></div>`).join('')}
  </div>
  <div class="card grid">
    <input id="busca" class="inp" style="max-width:320px" placeholder="Buscar loja ou e-mail da dona" value="${esc(st.q)}">
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Loja</th><th>Plano</th><th>Situação</th><th class="r">Usuárias</th><th class="r">Peças</th><th class="r">Vendas 30d</th><th class="r">Faturamento 30d</th><th>Última atividade</th><th></th></tr></thead><tbody>
    ${ls.map(l => `<tr><td><b style="font-weight:500">${esc(l.nome)}</b><span class="cellnote">${esc(l.dona_email || '')} · desde ${new Date(l.criado_em).toLocaleDateString('pt-BR')}</span></td>
      <td><select id="pl-${l.id}" class="inp sm" data-plano="${l.id}">${st.planos.map(p => `<option value="${p.id}" ${p.id === l.plano ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></td>
      <td>${l.ativa ? '<span class="pill good">ativa</span>' : '<span class="pill bad">suspensa</span>'}</td>
      <td class="r num">${l.usuarias}</td><td class="r num">${l.pecas}</td><td class="r num">${l.vendas_30d}</td><td class="r num">${brl(l.faturamento_30d)}</td>
      <td class="num small">${dataHora(l.ultima_atividade)}</td>
      <td class="r" style="white-space:nowrap"><button class="btn sm" data-hist="${l.id}">Histórico</button> <button class="btn sm ${l.ativa ? 'danger' : ''}" data-ativa="${l.id}" data-v="${!l.ativa}">${l.ativa ? 'Suspender' : 'Reativar'}</button></td></tr>`).join('') || '<tr><td colspan="9" class="empty">Nenhuma loja.</td></tr>'}
    </tbody></table></div>
  </div>
  <div class="card grid">
    <div class="head" style="align-items:center"><div><h3>Histórico de alterações${st.filtroLoja ? ' · ' + esc(nome(st.filtroLoja)) : ' · todas as lojas'}</h3><p class="muted small">As 100 alterações mais recentes.</p></div>${st.filtroLoja ? '<button class="btn sm" data-hist="">Ver todas as lojas</button>' : ''}</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Quando</th><th>Quem</th><th>O quê</th><th>Loja</th></tr></thead><tbody>
    ${st.aud.map(a => { const r = a.depois || a.antes || {}; return `<tr><td class="num small" style="white-space:nowrap">${dataHora(a.em)}</td><td>${esc(a.email)}</td><td>${ACAO[a.acao]} ${esc(TAB[a.tabela] || a.tabela)} <b style="font-weight:500">${esc(r.nome || r.email || (r.numero ? '#' + r.numero : '') || '')}</b></td><td class="small">${esc(nome(a.loja_id))}</td></tr>`; }).join('') || '<tr><td colspan="4" class="empty">Sem registros.</td></tr>'}
    </tbody></table></div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('sair').addEventListener('click', () => EO.sair());
  const s = await EO.exigirSessao(); if (!s) return;
  EO.vigiarSessao();
  try { await carregar(); render(); }
  catch (e) {
    document.getElementById('view').innerHTML = `<div class="locked"><h2>Acesso restrito</h2><p>Esta área é só da administração do EstoqueOn.</p><a class="btn" href="app.html">Voltar para a minha loja</a></div>`;
    return;
  }
  document.addEventListener('input', e => { if (e.target.id === 'busca') { st.q = e.target.value; render(); const b = document.getElementById('busca'); b.focus(); b.setSelectionRange(st.q.length, st.q.length); } });
  document.addEventListener('change', async e => {
    const id = e.target.dataset.plano; if (!id) return;
    const r = await sb().from('lojas').update({ plano: e.target.value }).eq('id', id);
    if (r.error) toast(EO.erro(r.error), 'bad'); else toast('Plano alterado');
    await carregar(); render();
  });
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.hist !== undefined) { st.filtroLoja = b.dataset.hist; await carregarAud(); render(); return; }
    if (b.dataset.ativa) {
      if (b.dataset.confirma !== '1' && b.dataset.v === 'false') { b.dataset.confirma = '1'; b.textContent = 'Confirmar'; return; }
      const r = await sb().from('lojas').update({ ativa: b.dataset.v === 'true' }).eq('id', b.dataset.ativa);
      if (r.error) toast(EO.erro(r.error), 'bad'); else toast(b.dataset.v === 'true' ? 'Loja reativada' : 'Loja suspensa');
      await carregar(); render();
    }
  });
});
})();
