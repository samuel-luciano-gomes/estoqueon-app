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
  async function sair() {
    try { await cliente().auth.signOut(); } catch (e) {}
    location.replace('entrar.html');
  }

  // Para onde ir depois do login: a página pedida (só páginas do próprio site) ou o app de celular em telas pequenas.
  function destino() {
    var v = new URLSearchParams(location.search).get('volta') || '';
    if (/^[a-z-]+\.html$/.test(v)) return v;
    var celular = matchMedia('(display-mode: standalone)').matches || matchMedia('(max-width: 700px)').matches;
    return celular ? 'celular.html' : 'app.html';
  }

  return { destino: destino, cliente: cliente, base: base, ligarSenha: ligarSenha, senhaForte: senhaForte, ligarMostrar: ligarMostrar,
           erro: erro, mostrar: mostrar, sessao: sessao, exigirSessao: exigirSessao, sair: sair };
})();
