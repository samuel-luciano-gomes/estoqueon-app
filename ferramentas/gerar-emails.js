// Gera os modelos de e-mail do Supabase Auth com a identidade do EstoqueOn.
// Uso: node ferramentas/gerar-emails.js  →  supabase/templates/*.html
// Depois, cole cada arquivo em Supabase → Authentication → Emails (ou use `supabase config push`).
const fs = require('fs'), path = require('path');
const saida = path.join(__dirname, '..', 'supabase', 'templates');
fs.mkdirSync(saida, { recursive: true });

const ROSE = '#A0596A', GOLD = '#A7834A', INK = '#2A1F22', MUTED = '#7F6C6C', LINE = '#EFE3E1', BG = '#FBF6F5';
const FONT = "Montserrat,'Segoe UI',Roboto,'Helvetica Neue',sans-serif";

function layout({ previa, eyebrow, titulo, texto, botao, link, rodape }) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${titulo}</title></head>
<body style="margin:0;padding:0;background:${BG};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${previa}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${LINE};border-radius:8px;">
    <tr><td style="padding:28px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:22px;height:22px;border:2px solid ${GOLD};border-radius:50%;text-align:center;vertical-align:middle;"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${ROSE};"></span></td>
        <td style="padding-left:10px;font-family:${FONT};font-size:17px;letter-spacing:.5px;color:${INK};font-weight:300;">Estoque<b style="color:${ROSE};font-weight:600;">On</b></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:8px 32px 0 32px;"><div style="height:1px;background:linear-gradient(90deg,${GOLD},#ffffff);background-color:${LINE};margin-top:18px;"></div></td></tr>
    <tr><td style="padding:26px 32px 8px 32px;font-family:${FONT};">
      <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">${eyebrow}</div>
      <h1 style="margin:10px 0 14px 0;font-size:24px;line-height:1.25;font-weight:300;color:${INK};">${titulo}</h1>
      <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${MUTED};">${texto}</p>
      ${botao ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${ROSE};border-radius:3px;">
        <a href="${link}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;text-decoration:none;">${botao}</a>
      </td></tr></table>
      <p style="margin:22px 0 0 0;font-size:12px;line-height:1.6;color:${MUTED};">Se o botão não abrir, copie este endereço no navegador:<br><a href="${link}" style="color:${ROSE};word-break:break-all;">${link}</a></p>` : ''}
    </td></tr>
    <tr><td style="padding:22px 32px 28px 32px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};border-top:1px solid ${LINE};">
      ${rodape}<br>Dúvidas: WhatsApp (31) 97310-9443 · A equipe EstoqueOn nunca pede a sua senha.
    </td></tr>
  </table>
  <p style="font-family:${FONT};font-size:11px;color:${MUTED};margin:16px 0 0 0;">EstoqueOn · estoque, preço e vendas para semijoias</p>
</td></tr></table>
</body></html>
`;
}

const modelos = {
  'confirmar-cadastro': {
    assunto: 'Confirme seu e-mail no EstoqueOn',
    previa: 'Falta um passo para abrir a sua loja no EstoqueOn.',
    eyebrow: 'Boas-vindas', titulo: 'Confirme seu e-mail para abrir a sua loja',
    texto: 'Olá{{ if .Data.nome }}, {{ .Data.nome }}{{ end }}! Recebemos o cadastro de <b style="color:' + INK + ';">{{ .Email }}</b> no EstoqueOn. Toque no botão abaixo para confirmar o e-mail e entrar no sistema.',
    botao: 'Confirmar e-mail', link: '{{ .ConfirmationURL }}',
    rodape: 'Se você não criou esta conta, ignore este e-mail: nada será ativado.'
  },
  'recuperar-senha': {
    assunto: 'Redefina sua senha do EstoqueOn',
    previa: 'Use o link para criar uma senha nova. Ele vale por uma hora.',
    eyebrow: 'Senha', titulo: 'Crie uma senha nova',
    texto: 'Recebemos um pedido para redefinir a senha de <b style="color:' + INK + ';">{{ .Email }}</b>. O link vale por uma hora e só funciona uma vez.',
    botao: 'Criar nova senha', link: '{{ .ConfirmationURL }}',
    rodape: 'Se não foi você, ignore este e-mail. Sua senha atual continua valendo.'
  },
  'link-magico': {
    assunto: 'Seu link de acesso ao EstoqueOn',
    previa: 'Entre no EstoqueOn com um toque.',
    eyebrow: 'Acesso', titulo: 'Seu link para entrar',
    texto: 'Use o botão abaixo para entrar no EstoqueOn como <b style="color:' + INK + ';">{{ .Email }}</b>. O link vale por uma hora.',
    botao: 'Entrar no EstoqueOn', link: '{{ .ConfirmationURL }}',
    rodape: 'Se você não pediu este acesso, ignore este e-mail.'
  },
  'trocar-email': {
    assunto: 'Confirme a troca de e-mail no EstoqueOn',
    previa: 'Confirme o novo e-mail da sua conta.',
    eyebrow: 'Conta', titulo: 'Confirme o novo e-mail',
    texto: 'Foi pedida a troca do e-mail da conta de <b style="color:' + INK + ';">{{ .Email }}</b> para <b style="color:' + INK + ';">{{ .NewEmail }}</b>. Confirme para concluir.',
    botao: 'Confirmar troca', link: '{{ .ConfirmationURL }}',
    rodape: 'Se você não pediu essa troca, entre na sua conta e altere a senha.'
  },
  'convite': {
    assunto: 'Você foi convidada para o EstoqueOn',
    previa: 'Uma loja convidou você para usar o EstoqueOn.',
    eyebrow: 'Convite', titulo: 'Você foi convidada para uma loja',
    texto: 'Uma loja convidou <b style="color:' + INK + ';">{{ .Email }}</b> para usar o EstoqueOn. Toque no botão para aceitar e criar a sua senha.',
    botao: 'Aceitar convite', link: '{{ .ConfirmationURL }}',
    rodape: 'Se você não esperava este convite, ignore este e-mail.'
  },
  'reautenticacao': {
    assunto: 'Código de confirmação do EstoqueOn',
    previa: 'Seu código de confirmação.',
    eyebrow: 'Segurança', titulo: 'Seu código de confirmação',
    texto: 'Use o código abaixo para confirmar a alteração na sua conta:<br><span style="display:inline-block;margin-top:14px;font-size:28px;letter-spacing:8px;color:' + INK + ';font-weight:500;">{{ .Token }}</span>',
    botao: null, link: '',
    rodape: 'Se não foi você, altere sua senha.'
  }
};

const assuntos = {};
for (const [nome, m] of Object.entries(modelos)) {
  fs.writeFileSync(path.join(saida, nome + '.html'), layout(m));
  assuntos[nome] = m.assunto;
}
fs.writeFileSync(path.join(saida, 'assuntos.json'), JSON.stringify(assuntos, null, 2) + '\n');
console.log('Modelos gerados em', saida);
