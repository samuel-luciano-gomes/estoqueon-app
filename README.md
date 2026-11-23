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
| `celular.html` | App de celular (instalável): leitor de QR ao vivo, produtos em cards ou lista, clientes e pós-venda, caixa, nota fiscal |
| `privacidade.html` | Privacidade (LGPD) e termos de uso |

## Banco de dados

Tudo está em `supabase/migrations/20261122000000_estoqueon.sql`:

- **Lojas e equipe:** cada cadastro cria a loja da pessoa (dona). Convites por e-mail colocam vendedoras na loja.
- **Papéis:** a dona altera preços, insumos, marca e equipe. A vendedora registra vendas, entradas e conferências.
- **Planos:** Simples (1 usuária, 300 peças), Prata (3 usuárias, peças ilimitadas), Gold (10 usuárias, até 3 lojas). Os limites são aplicados pelo banco. Só o master muda o plano.
- **Histórico:** todo INSERT, UPDATE e DELETE das tabelas da loja vai para `auditoria`, com antes, depois, e-mail e horário. Ninguém escreve nem apaga ali; a dona vê o da loja, o master vê tudo.
- **Vendas:** `registrar_venda` grava cliente, itens, baixa de estoque e lucro numa só transação, recalculando o preço no banco.
- **Segurança:** RLS em todas as tabelas. Visitantes sem login só leem a tabela de planos.

`supabase/migrations/20261123000000_app_celular.sql` acrescenta o que o app de celular usa:

- **Caixa (`lancamentos`):** entradas e saídas por categoria e forma. Toda venda lança a entrada sozinha (e a taxa da maquininha como saída). Lançamentos de venda e de nota não podem ser editados pelo app.
- **Clientes:** aniversário, Instagram, preferências e se aceita ofertas. `contatos` guarda cada mensagem de pós-venda enviada.
- **Nota fiscal (`notas` + `importar_nota`):** lê o XML da NF-e, associa itens pelo código do fornecedor, código de barras ou nome parecido, cria as peças novas, dá entrada no estoque, atualiza o custo e lança a compra no caixa. A mesma nota não entra duas vezes.
- **Fotos:** bucket `produtos` no Storage, uma pasta por loja; só a dona envia.

## App de celular

`celular.html` é um PWA: abre no navegador do celular e pode ser instalado na tela inicial (Android: Chrome → Instalar app; iPhone: Safari → Compartilhar → Adicionar à Tela de Início). O leitor usa a câmera ao vivo (BarcodeDetector quando o aparelho tem, jsQR nos demais) e lê QR das etiquetas e código de barras EAN.

Para testar as telas sem login, `teste-celular.html` + `teste-mock.js` imitam o Supabase com dados de exemplo (ficam fora do Git).

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

O ícone (etiqueta com QR) está em `assets/icone.svg` e `ferramentas/icone-maskable.svg`; os PNGs saem com `npm i --no-save @resvg/resvg-js && node ferramentas/gerar-icones.js`.

Montserrat e Jost ficam em `assets/fonts` (licença SIL Open Font License), sem depender do Google Fonts.
