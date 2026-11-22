# EstoqueOn

Sistema de estoque, preço e vendas para lojas de semijoias e acessórios, com a marca e as cores de cada loja.

- **Site:** https://samuel-luciano-gomes.github.io/estoqueon/
- **Banco e login:** Supabase (projeto `estoqueon`)
- **Contato comercial:** WhatsApp (31) 97310-9443

## Páginas

| Arquivo | O que é |
| --- | --- |
| `index.html` | Página de vendas, com planos Simples, Prata e Gold |
| `cadastro.html` | Criar conta (senha forte, confirmação por e-mail, aceite da política) |
| `entrar.html` | Login |
| `recuperar.html` / `nova-senha.html` | Recuperação de senha por link |
| `app.html` | Sistema da loja: painel, produtos, leitor, vendas, histórico, ajustes |
| `master.html` | Administração: todas as lojas, planos, suspensão e histórico geral |
| `privacidade.html` | Privacidade (LGPD) e termos de uso |

## Banco de dados

Tudo está em `supabase/migrations/20261122000000_estoqueon.sql`:

- **Lojas e equipe:** cada cadastro cria a loja da pessoa (dona). Convites por e-mail colocam vendedoras na loja.
- **Papéis:** a dona altera preços, insumos, marca e equipe. A vendedora registra vendas, entradas e conferências.
- **Planos:** Simples (1 usuária, 300 peças), Prata (3 usuárias, peças ilimitadas), Gold (10 usuárias, até 3 lojas). Os limites são aplicados pelo banco. Só o master muda o plano.
- **Histórico:** todo INSERT, UPDATE e DELETE das tabelas da loja vai para `auditoria`, com antes, depois, e-mail e horário. Ninguém escreve nem apaga ali; a dona vê o da loja, o master vê tudo.
- **Vendas:** `registrar_venda` grava cliente, itens, baixa de estoque e lucro numa só transação, recalculando o preço no banco.
- **Segurança:** RLS em todas as tabelas. Visitantes sem login só leem a tabela de planos.

### Tornar alguém master

Depois que a pessoa criar a conta pelo site, rode no SQL Editor:

```sql
insert into public.masters (user_id) select id from auth.users where email = 'email@da-pessoa.com';
```

## Configuração do Supabase Auth

Em **Authentication**:

- **URL Configuration:** Site URL `https://samuel-luciano-gomes.github.io/estoqueon/`; Redirect URLs `…/estoqueon/app.html`, `…/estoqueon/nova-senha.html` e `http://localhost:4330/*`.
- **Sign In / Providers → Email:** confirmação de e-mail ligada, senha mínima de 10 caracteres com minúscula, maiúscula, número e símbolo; troca de senha segura ligada.
- **Emails → Templates:** os modelos estão em `supabase/templates/` (assuntos em `assuntos.json`). Para mudar o visual, edite `ferramentas/gerar-emails.js` e rode `node ferramentas/gerar-emails.js`. O Supabase só libera a edição dos modelos depois que o SMTP próprio estiver ligado (veja abaixo); até lá, os e-mails saem com o texto padrão do Supabase.

### E-mail com remetente próprio

O envio padrão do Supabase só entrega para e-mails da equipe do projeto e tem limite baixo por hora. Para enviar a qualquer cliente como "EstoqueOn":

1. Registre um domínio (por exemplo, `estoqueon.com.br`).
2. Crie conta no Resend ou no Brevo e verifique o domínio (registros DNS que o serviço mostra).
3. Em **Authentication → Emails → SMTP Settings**, ligue o SMTP próprio com remetente `EstoqueOn <nao-responda@estoqueon.com.br>`.

## Rodar no computador

```bash
node serve-local.js   # http://localhost:4330
```

Para testar o banco localmente, o projeto pode usar o Supabase CLI (`supabase start`), que lê `supabase/config.toml`.

## Fontes

Montserrat e Jost ficam em `assets/fonts` (licença SIL Open Font License), sem depender do Google Fonts.
