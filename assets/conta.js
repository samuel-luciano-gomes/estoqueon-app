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

  return { destino: destino, cliente: cliente, base: base, ligarSenha: ligarSenha, senhaForte: senhaForte, ligarMostrar: ligarMostrar,
           erro: erro, mostrar: mostrar, sessao: sessao, exigirSessao: exigirSessao, sair: sair,
           marcarLogin: marcarLogin, vigiarSessao: vigiarSessao, PRAZO: PRAZO };
})();
