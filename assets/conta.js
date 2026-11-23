// EstoqueOn — conexão com o Supabase e utilidades de conta, usadas por todas as páginas.
window.EO = (function () {
  var CFG = window.ESTOQUEON_SUPABASE || {};
  var sb = null;

  function cliente() {
    if (sb) return sb;
    if (!CFG.url || !CFG.key || !window.supabase) throw new Error('Configuração do Supabase ausente.');
    sb = window.supabase.createClient(CFG.url, CFG.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return sb;
  }

  // Endereço da pasta do site (funciona no GitHub Pages e no computador).
  function base() { return new URL('.', location.href).href; }

  var REGRAS = [
    { t: '10 caracteres ou mais', f: function (s) { return s.length >= 10; } },
    { t: 'Letra maiúscula', f: function (s) { return /[A-ZÀ-Ý]/.test(s); } },
    { t: 'Letra minúscula', f: function (s) { return /[a-zà-ÿ]/.test(s); } },
    { t: 'Número', f: function (s) { return /\d/.test(s); } },
    { t: 'Símbolo (!@#…)', f: function (s) { return /[^A-Za-zÀ-ÿ0-9]/.test(s); } }
  ];

  // Liga a lista de regras e a barra de força a um campo de senha.
  function ligarSenha(input, lista, barra) {
    lista.innerHTML = REGRAS.map(function (r) { return '<li>' + r.t + '</li>'; }).join('');
    function atualizar() {
      var s = input.value, ok = 0;
      REGRAS.forEach(function (r, i) { var v = r.f(s); if (v) ok++; lista.children[i].classList.toggle('ok', v); });
      var cores = ['var(--bad)', 'var(--bad)', 'var(--warn)', 'var(--warn)', 'var(--gold)', 'var(--good)'];
      barra.style.width = (ok / REGRAS.length * 100) + '%';
      barra.style.background = cores[ok];
    }
    input.addEventListener('input', atualizar); atualizar();
  }
  function senhaForte(s) { return REGRAS.every(function (r) { return r.f(s); }); }

  // Botão "mostrar" ao lado dos campos de senha.
  function ligarMostrar(root) {
    (root || document).querySelectorAll('.pass-wrap button').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = b.parentNode.querySelector('input');
        var ver = i.type === 'password';
        i.type = ver ? 'text' : 'password';
        b.textContent = ver ? 'Ocultar' : 'Mostrar';
        b.setAttribute('aria-pressed', ver);
      });
    });
  }

  // Mensagens de erro em português, sem revelar se um e-mail existe.
  function erro(e) {
    var m = String((e && (e.message || e.error_description)) || e || '');
    var s = e && e.status;
    if (s === 429 || /rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
    if (/invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/email not confirmed/i.test(m)) return 'Confirme o seu e-mail antes de entrar. Procure a mensagem do EstoqueOn na caixa de entrada ou no spam.';
    if (/password.*(weak|short|at least|characters)/i.test(m) || /weak_password/i.test(m)) return 'A senha não atende às regras de segurança.';
    if (/reauthenticat/i.test(m)) return 'Por segurança, saia e entre de novo na conta antes de trocar a senha.';
    if (/same.*password|different from the old/i.test(m)) return 'Escolha uma senha diferente da anterior.';
    if (/expired|invalid.*(token|link)|otp/i.test(m)) return 'Este link expirou ou já foi usado. Peça um novo.';
    if (/failed to fetch|network/i.test(m)) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
    if (/configuração do supabase/i.test(m)) return 'O site ainda não está ligado ao banco de dados.';
    return m || 'Algo deu errado. Tente de novo.';
  }

  function mostrar(el, tipo, msg) {
    el.className = 'alert ' + tipo; el.textContent = msg; el.hidden = false;
  }

  async function sessao() {
    var r = await cliente().auth.getSession();
    return r.data.session;
  }
  async function exigirSessao() {
    var s = null;
    try { s = await sessao(); } catch (e) { s = null; }
    if (!s) {
      var pagina = location.pathname.split('/').pop() || 'app.html';
      location.replace('entrar.html' + (pagina !== 'app.html' ? '?volta=' + encodeURIComponent(pagina) : ''));
      return null;
    }
    return s;
  }
  // Sai só deste aparelho. O banco recusa a sessão encerrada na hora (ver migração prazo_sessao).
  async function sair(motivo) {
    pararVigia();
    try { await cliente().auth.signOut({ scope: 'local' }); } catch (e) {}
    try { localStorage.removeItem('eo-login-em'); localStorage.removeItem('eo-ativo-em'); } catch (e) {}
    var pagina = location.pathname.split('/').pop() || 'app.html';
    var q = [];
    if (motivo) q.push('motivo=' + motivo);
    if (motivo && pagina !== 'app.html' && pagina !== 'entrar.html') q.push('volta=' + encodeURIComponent(pagina));
    location.replace('entrar.html' + (q.length ? '?' + q.join('&') : ''));
  }

  /* ---------- prazo do login ----------
     Inatividade: sem tocar, digitar ou rolar por 1 hora, sai (aviso 1 minuto antes).
     Prazo máximo: 12 horas depois de entrar, pede login de novo (o banco também recusa depois disso). */
  var PRAZO = { inatividadeMin: 60, avisoSeg: 60, maxHoras: 12, checarServidorMin: 5 };
  var vig = { timer: 0, servidor: 0, aviso: null, ultimoToque: 0 };
  function agora() { return Date.now(); }
  function lerNum(k) { try { return Number(localStorage.getItem(k)) || 0; } catch (e) { return 0; } }
  function gravarNum(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  function marcarLogin() { gravarNum('eo-login-em', agora()); gravarNum('eo-ativo-em', agora()); }
  function atividade() {
    var t = agora(); if (t - vig.ultimoToque < 5000) return;
    vig.ultimoToque = t; gravarNum('eo-ativo-em', t); esconderAviso();
  }
  function esconderAviso() { if (vig.aviso) { vig.aviso.remove(); vig.aviso = null; } }
  function mostrarAviso(seg) {
    if (!vig.aviso) {
      vig.aviso = document.createElement('div');
      vig.aviso.className = 'eo-aviso'; vig.aviso.setAttribute('role', 'alertdialog'); vig.aviso.setAttribute('aria-live', 'assertive');
      vig.aviso.innerHTML = '<div><b>Você ainda está aí?</b><span></span></div><button type="button" class="btn primary">Continuar conectado</button>';
      vig.aviso.querySelector('button').addEventListener('click', function () { vig.ultimoToque = 0; atividade(); });
      document.body.appendChild(vig.aviso);
    }
    vig.aviso.querySelector('span').textContent = 'Por segurança, você sai em ' + seg + ' segundo' + (seg === 1 ? '' : 's') + ' por falta de uso.';
  }
  function checar() {
    var P = Object.assign({}, PRAZO, window.EO_PRAZO_TESTE || {});
    var t = agora(), login = lerNum('eo-login-em'), ativo = lerNum('eo-ativo-em');
    if (!login) { marcarLogin(); return; }
    if (t - login > P.maxHoras * 3600e3) return sair('prazo');
    var limite = P.inatividadeMin * 60e3, parado = t - (ativo || login);
    if (parado >= limite) return sair('inatividade');
    if (parado >= limite - P.avisoSeg * 1000) mostrarAviso(Math.max(1, Math.ceil((limite - parado) / 1000))); else esconderAviso();
  }
  async function checarServidor() {
    try {
      var r = await cliente().rpc('sessao_ok');
      if (!r.error && r.data === false) sair('sessao');
    } catch (e) {}
  }
  function vigiarSessao() {
    var P = Object.assign({}, PRAZO, window.EO_PRAZO_TESTE || {});
    if (!lerNum('eo-login-em')) marcarLogin();
    ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(function (ev) { addEventListener(ev, atividade, { passive: true, capture: true }); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { checar(); checarServidor(); } });
    addEventListener('storage', function (e) { if (e.key === 'eo-ativo-em') esconderAviso(); });
    clearInterval(vig.timer); vig.timer = setInterval(checar, 1000);
    clearInterval(vig.servidor); vig.servidor = setInterval(checarServidor, P.checarServidorMin * 60e3);
    checar(); checarServidor();
  }
  function pararVigia() { clearInterval(vig.timer); clearInterval(vig.servidor); esconderAviso(); }

  // Para onde ir depois do login: a página pedida (só páginas do próprio site) ou o app de celular em telas pequenas.
  function destino() {
    var v = new URLSearchParams(location.search).get('volta') || '';
    if (/^[a-z-]+\.html$/.test(v)) return v;
    var celular = matchMedia('(display-mode: standalone)').matches || matchMedia('(max-width: 700px)').matches;
    return celular ? 'celular.html' : 'app.html';
  }

  // Botão de suporte pelo WhatsApp (ícone + texto), já com a mensagem pronta.
  var WA_SUPORTE = '5531973109443';
  var WA_ICONE = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41z"/></svg>';
  // No celular, abre o aplicativo do WhatsApp direto (whatsapp://). O link wa.me abre uma janela de
  // navegador que repassa para o WhatsApp e fica em branco por cima do app quando a pessoa volta.
  var celular = /Android|iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function paraApp(url) {
    var m = String(url).match(/^https:\/\/(?:wa\.me|api\.whatsapp\.com\/send)\/?(\d*)\/?\??(.*)$/);
    if (!m) return null;
    var q = new URLSearchParams(m[2]); var p = [];
    if (m[1] || q.get('phone')) p.push('phone=' + (m[1] || q.get('phone')));
    if (q.get('text')) p.push('text=' + encodeURIComponent(q.get('text')));
    return 'whatsapp://send' + (p.length ? '?' + p.join('&') : '');
  }
  function abrirWhats(url) {
    var app = celular && paraApp(url);
    if (!app) { window.open(url, '_blank', 'noopener'); return; }
    var saiu = false;
    // Saiu do app, ou apareceu a pergunta "Abrir no WhatsApp?" do sistema (a página perde o foco).
    var marcar = function () { saiu = true; };
    var vis = function () { if (document.hidden) saiu = true; };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('blur', marcar);
    window.addEventListener('pagehide', marcar);
    location.href = app;
    // Só se nada aconteceu (WhatsApp não instalado), usa o link normal.
    setTimeout(function () {
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('blur', marcar);
      window.removeEventListener('pagehide', marcar);
      if (!saiu && !document.hidden && document.hasFocus()) window.open(url, '_blank', 'noopener');
    }, 2500);
  }
  // Qualquer link para o WhatsApp em qualquer tela passa por aqui.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="https://wa.me/"],a[href^="https://api.whatsapp.com/"]');
    if (!a || !celular || e.defaultPrevented) return;
    e.preventDefault(); abrirWhats(a.href);
  }, true);

  function linkWhats(mensagem) { return 'https://wa.me/' + WA_SUPORTE + '?text=' + encodeURIComponent(mensagem || 'Olá! Tenho uma dúvida sobre o EstoqueOn.'); }
  function botaoWhats(texto, mensagem, classe) {
    var a = document.createElement('a');
    a.className = classe || 'btn-wa'; a.href = linkWhats(mensagem); a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = WA_ICONE + '<span></span>'; a.querySelector('span').textContent = texto || 'Falar no WhatsApp';
    return a.outerHTML;
  }

  return { destino: destino, cliente: cliente, linkWhats: linkWhats, abrirWhats: abrirWhats, botaoWhats: botaoWhats, WA_ICONE: WA_ICONE, base: base, ligarSenha: ligarSenha, senhaForte: senhaForte, ligarMostrar: ligarMostrar,
           erro: erro, mostrar: mostrar, sessao: sessao, exigirSessao: exigirSessao, sair: sair,
           marcarLogin: marcarLogin, vigiarSessao: vigiarSessao, PRAZO: PRAZO };
})();
