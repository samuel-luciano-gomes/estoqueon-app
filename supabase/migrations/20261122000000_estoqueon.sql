-- EstoqueOn: banco completo (lojas, planos, equipe, estoque, vendas, histórico de alterações).
-- Rodar uma vez no SQL Editor do Supabase (ou com `supabase db push`).
-- Segurança: toda tabela tem RLS. Quem vê e altera cada linha é decidido aqui, não no site.

------------------------------------------------------------------
-- Planos
------------------------------------------------------------------
create table public.planos (
  id text primary key,
  nome text not null,
  preco_mensal numeric(10,2) not null,
  max_usuarias int not null,
  max_pecas int,            -- null = ilimitado
  max_lojas int not null,
  ordem int not null
);
insert into public.planos values
  ('simples','Simples', 49.00,  1,  300, 1, 1),
  ('prata',  'Prata',   89.00,  3, null, 1, 2),
  ('gold',   'Gold',   149.00, 10, null, 3, 3);

------------------------------------------------------------------
-- Pessoas
------------------------------------------------------------------
-- Usuários master (administração do EstoqueOn). Só entra aqui pelo SQL Editor.
create table public.masters (
  user_id uuid primary key references auth.users on delete cascade,
  criado_em timestamptz not null default now()
);

create table public.perfis (
  id uuid primary key references auth.users on delete cascade,
  nome text not null default '' check (char_length(nome) <= 80),
  email text not null,
  criado_em timestamptz not null default now()
);

------------------------------------------------------------------
-- Lojas e equipe
------------------------------------------------------------------
create table public.lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) between 2 and 60),
  assinatura text not null default '' check (char_length(assinatura) <= 80),
  instagram text not null default '' check (char_length(instagram) <= 40),
  paleta text not null default 'rose' check (paleta in ('rose','gold','perola')),
  plano text not null default 'simples' references public.planos,
  ativa boolean not null default true,
  dona uuid not null references auth.users,
  markup numeric(6,3) not null default 1.8 check (markup > 0 and markup < 20),
  taxa_cartao numeric(5,2) not null default 6 check (taxa_cartao >= 0 and taxa_cartao < 100),
  imposto numeric(5,2) not null default 0 check (imposto >= 0 and imposto < 100),
  arredondar boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.membros (
  loja_id uuid not null references public.lojas on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  papel text not null default 'vendedora' check (papel in ('dona','vendedora')),
  criado_em timestamptz not null default now(),
  primary key (loja_id, user_id)
);
create index on public.membros (user_id);

create table public.convites (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  papel text not null default 'vendedora' check (papel in ('dona','vendedora')),
  criado_por uuid default auth.uid() references auth.users on delete set null,
  criado_em timestamptz not null default now(),
  unique (loja_id, email)
);

------------------------------------------------------------------
-- Estoque e vendas
------------------------------------------------------------------
create table public.insumos (
  id bigint generated always as identity primary key,
  loja_id uuid not null references public.lojas on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  tipo text not null default 'Embalagem' check (tipo in ('Embalagem','Impressão','Outros')),
  total numeric(10,2) not null default 0 check (total >= 0),
  qtd int not null default 100 check (qtd >= 0)
);
create index on public.insumos (loja_id);

create table public.produtos (
  id bigint generated always as identity primary key,
  loja_id uuid not null references public.lojas on delete cascade,
  sku text not null check (char_length(sku) between 1 and 30),
  nome text not null check (char_length(trim(nome)) between 1 and 80),
  categoria text not null default '' check (char_length(categoria) <= 40),
  fornecedor text not null default '' check (char_length(fornecedor) <= 60),
  sku_fornecedor text not null default '' check (char_length(sku_fornecedor) <= 40),
  custo numeric(10,2) not null default 0 check (custo >= 0),
  preco numeric(10,2) check (preco is null or preco >= 0),   -- null = usar o preço calculado
  estoque_minimo int not null default 2 check (estoque_minimo >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (loja_id, sku)
);

create table public.clientes (
  id bigint generated always as identity primary key,
  loja_id uuid not null references public.lojas on delete cascade,
  nome text not null check (char_length(trim(nome)) between 2 and 80),
  whatsapp text not null default '' check (whatsapp ~ '^[0-9]{0,13}$'),
  criado_em timestamptz not null default now()
);
create index on public.clientes (loja_id);

create table public.vendas (
  id bigint generated always as identity primary key,
  loja_id uuid not null references public.lojas on delete cascade,
  numero int not null,
  data date not null default current_date,
  cliente_id bigint references public.clientes on delete set null,
  pagamento text not null check (pagamento in ('vista','cartao')),
  parcelas int not null default 1 check (parcelas between 1 and 12),
  total numeric(12,2) not null,
  lucro numeric(12,2) not null,
  usuario uuid default auth.uid() references auth.users on delete set null,
  criado_em timestamptz not null default now(),
  unique (loja_id, numero)
);
create index on public.vendas (loja_id, data);

create table public.venda_itens (
  id bigint generated always as identity primary key,
  venda_id bigint not null references public.vendas on delete cascade,
  loja_id uuid not null references public.lojas on delete cascade,
  produto_id bigint not null references public.produtos,
  qtd int not null check (qtd > 0),
  preco numeric(10,2) not null check (preco >= 0),
  custo_unit numeric(10,2) not null,
  calc numeric(10,2) not null,
  lucro numeric(12,2) not null
);
create index on public.venda_itens (venda_id);
create index on public.venda_itens (loja_id, produto_id);

create table public.movimentos (
  id bigint generated always as identity primary key,
  loja_id uuid not null references public.lojas on delete cascade,
  produto_id bigint not null references public.produtos on delete cascade,
  data date not null default current_date,
  tipo text not null check (tipo in ('entrada','venda','ajuste')),
  qtd int not null check (qtd <> 0),
  ref text not null default '' check (char_length(ref) <= 80),
  usuario uuid default auth.uid() references auth.users on delete set null,
  criado_em timestamptz not null default now()
);
create index on public.movimentos (loja_id, produto_id);

------------------------------------------------------------------
-- Histórico de alterações (somente leitura para todo mundo)
------------------------------------------------------------------
create table public.auditoria (
  id bigint generated always as identity primary key,
  loja_id uuid,
  tabela text not null,
  registro text,
  acao text not null check (acao in ('INSERT','UPDATE','DELETE')),
  antes jsonb,
  depois jsonb,
  usuario uuid,
  email text,
  em timestamptz not null default now()
);
create index on public.auditoria (loja_id, em desc);
create index on public.auditoria (em desc);

------------------------------------------------------------------
-- Funções de permissão
------------------------------------------------------------------
create or replace function public.eh_master() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from masters where user_id = auth.uid());
$$;

create or replace function public.eh_membro(p_loja uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membros m join lojas l on l.id = m.loja_id
    where m.loja_id = p_loja and m.user_id = auth.uid() and l.ativa);
$$;

create or replace function public.eh_dona(p_loja uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membros m join lojas l on l.id = m.loja_id
    where m.loja_id = p_loja and m.user_id = auth.uid() and m.papel = 'dona' and l.ativa);
$$;

-- Pessoas que dividem alguma loja com quem está logado (para mostrar nomes da equipe).
create or replace function public.mesma_loja(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membros a join membros b on a.loja_id = b.loja_id
    where a.user_id = auth.uid() and b.user_id = p_user);
$$;

------------------------------------------------------------------
-- Gatilho de auditoria
------------------------------------------------------------------
create or replace function public.fn_auditoria() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_loja uuid;
begin
  if tg_op = 'UPDATE' and v_old = v_new then return new; end if;
  v_loja := case when tg_table_name = 'lojas' then (v_row->>'id')::uuid else (v_row->>'loja_id')::uuid end;
  insert into auditoria (loja_id, tabela, registro, acao, antes, depois, usuario, email)
  values (v_loja, tg_table_name,
          coalesce(v_row->>'id', v_row->>'user_id'),
          tg_op, v_old, v_new, auth.uid(),
          coalesce(auth.jwt()->>'email', 'sistema'));
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['lojas','membros','convites','insumos','produtos','clientes','vendas','venda_itens','movimentos','masters']
  loop
    execute format('create trigger auditar after insert or update or delete on public.%I for each row execute function public.fn_auditoria()', t);
  end loop;
end $$;

------------------------------------------------------------------
-- Regras de negócio
------------------------------------------------------------------
-- Só o master muda plano, situação e dona da loja.
create or replace function public.proteger_loja() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not eh_master() and (new.plano is distinct from old.plano
      or new.ativa is distinct from old.ativa
      or new.dona is distinct from old.dona) then
    raise exception 'Somente a administração do EstoqueOn altera plano, situação ou dona da loja.';
  end if;
  return new;
end $$;
create trigger proteger_loja before update on public.lojas
  for each row execute function public.proteger_loja();

-- Limite de peças do plano.
create or replace function public.limite_pecas() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_max int; v_nome text; v_qtd int;
begin
  select p.max_pecas, p.nome into v_max, v_nome
    from lojas l join planos p on p.id = l.plano where l.id = new.loja_id;
  if v_max is not null then
    select count(*) into v_qtd from produtos where loja_id = new.loja_id and ativo;
    if v_qtd >= v_max then
      raise exception 'O plano % permite até % peças. Fale com a gente para mudar de plano.', v_nome, v_max;
    end if;
  end if;
  return new;
end $$;
create trigger limite_pecas before insert on public.produtos
  for each row execute function public.limite_pecas();

-- Limite de usuárias do plano (membros + convites pendentes).
create or replace function public.limite_usuarias() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_max int; v_nome text; v_qtd int;
begin
  select p.max_usuarias, p.nome into v_max, v_nome
    from lojas l join planos p on p.id = l.plano where l.id = new.loja_id;
  select (select count(*) from membros where loja_id = new.loja_id)
       + (select count(*) from convites where loja_id = new.loja_id) into v_qtd;
  if v_qtd >= v_max then
    raise exception 'O plano % permite até % usuária(s) por loja.', v_nome, v_max;
  end if;
  new.email := lower(trim(new.email));
  return new;
end $$;
create trigger limite_usuarias before insert on public.convites
  for each row execute function public.limite_usuarias();

-- Insumos que toda loja nova recebe.
create or replace function public.insumos_padrao(p_loja uuid) returns void
language sql security definer set search_path = public as $$
  insert into insumos (loja_id, nome, tipo, total, qtd) values
    (p_loja,'Sacola kraft','Embalagem',60,100),
    (p_loja,'Caixinha','Embalagem',45,50),
    (p_loja,'Papel seda','Embalagem',20,100),
    (p_loja,'Adesivo da marca','Embalagem',15,100),
    (p_loja,'Fita de cetim','Embalagem',12,100),
    (p_loja,'Tag com QR','Impressão',30,100),
    (p_loja,'Cartão de agradecimento','Impressão',30,100);
$$;

-- Cadastro: cria perfil; entra nas lojas que convidaram o e-mail ou cria a própria loja.
create or replace function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_loja uuid; c record;
begin
  insert into perfis (id, nome, email)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'nome', ''), 80), lower(new.email));

  for c in select * from convites where email = lower(new.email) loop
    insert into membros (loja_id, user_id, papel) values (c.loja_id, new.id, c.papel)
      on conflict do nothing;
    delete from convites where id = c.id;
  end loop;

  if not exists (select 1 from membros where user_id = new.id) then
    insert into lojas (nome, dona)
    values (coalesce(nullif(left(trim(new.raw_user_meta_data->>'loja'), 60), ''), 'Minha loja'), new.id)
    returning id into v_loja;
    insert into membros (loja_id, user_id, papel) values (v_loja, new.id, 'dona');
    perform insumos_padrao(v_loja);
  end if;
  return new;
end $$;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.novo_usuario();

-- Nova loja (plano Gold permite até 3 lojas por dona).
create or replace function public.criar_loja(p_nome text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_loja uuid; v_max int; v_qtd int;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  select max(p.max_lojas) into v_max
    from lojas l join planos p on p.id = l.plano where l.dona = auth.uid() and l.ativa;
  select count(*) into v_qtd from lojas where dona = auth.uid();
  if v_max is null then
    raise exception 'Somente a dona de uma loja no plano Gold pode criar outra loja.';
  end if;
  if v_max <= v_qtd then
    raise exception 'Seu plano permite % loja(s). O plano Gold permite até 3.', coalesce(v_max, 1);
  end if;
  insert into lojas (nome, dona, plano)
  values (left(trim(p_nome), 60), auth.uid(),
          (select l.plano from lojas l join planos p on p.id = l.plano
            where l.dona = auth.uid() order by p.ordem desc limit 1))
  returning id into v_loja;
  insert into membros (loja_id, user_id, papel) values (v_loja, auth.uid(), 'dona');
  perform insumos_padrao(v_loja);
  return v_loja;
end $$;

------------------------------------------------------------------
-- Preço (mesma regra do site, para a venda não depender do navegador)
------------------------------------------------------------------
create or replace function public.arred(v numeric, ligado boolean) returns numeric
language plpgsql immutable set search_path = '' as $$
declare r numeric;
begin
  if not ligado then return round(v, 2); end if;
  r := floor(v) + 0.9;
  if r < v - 0.000000001 then r := r + 1; end if;
  return round(r, 2);
end $$;

-- Registra a venda inteira de uma vez: cliente, itens, baixa de estoque e lucro.
create or replace function public.registrar_venda(
  p_loja uuid, p_cliente_id bigint, p_cliente_nome text, p_cliente_whatsapp text,
  p_pagamento text, p_parcelas int, p_itens jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  l lojas%rowtype; v_rateio numeric; v_cli bigint := p_cliente_id; v_venda bigint; v_num int;
  it jsonb; p produtos%rowtype; v_qtd int; v_preco numeric; v_est int;
  v_custo numeric; v_calc numeric; v_liq numeric; v_lucro numeric;
  v_total numeric := 0; v_lucro_total numeric := 0;
begin
  if not eh_membro(p_loja) then raise exception 'Sem acesso a esta loja.'; end if;
  if p_pagamento not in ('vista','cartao') then raise exception 'Forma de pagamento inválida.'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'A venda precisa de ao menos uma peça.';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_loja::text));
  select * into l from lojas where id = p_loja;
  select coalesce(sum(total / nullif(qtd, 0)), 0) into v_rateio from insumos where loja_id = p_loja and qtd > 0;

  if v_cli is null then
    if coalesce(trim(p_cliente_nome), '') = '' then raise exception 'Escolha a cliente.'; end if;
    insert into clientes (loja_id, nome, whatsapp)
    values (p_loja, trim(p_cliente_nome), regexp_replace(coalesce(p_cliente_whatsapp, ''), '\D', '', 'g'))
    returning id into v_cli;
  elsif not exists (select 1 from clientes where id = v_cli and loja_id = p_loja) then
    raise exception 'Cliente não encontrada.';
  end if;

  select coalesce(max(numero), 0) + 1 into v_num from vendas where loja_id = p_loja;
  insert into vendas (loja_id, numero, cliente_id, pagamento, parcelas, total, lucro)
  values (p_loja, v_num, v_cli, p_pagamento, case when p_pagamento = 'cartao' then greatest(1, p_parcelas) else 1 end, 0, 0)
  returning id into v_venda;

  for it in select * from jsonb_array_elements(p_itens) loop
    select * into p from produtos where id = (it->>'produto_id')::bigint and loja_id = p_loja;
    if not found then raise exception 'Peça não encontrada.'; end if;
    v_qtd := (it->>'qtd')::int; v_preco := round((it->>'preco')::numeric, 2);
    if v_qtd is null or v_qtd <= 0 or v_preco is null or v_preco < 0 then raise exception 'Quantidade ou preço inválido.'; end if;
    select coalesce(sum(qtd), 0) into v_est from movimentos where produto_id = p.id;
    if v_qtd > v_est then raise exception 'Estoque insuficiente de % (há %).', p.nome, v_est; end if;

    v_custo := p.custo + v_rateio;
    v_calc := arred(v_custo * l.markup / (1 - l.imposto / 100), l.arredondar);
    if p_pagamento = 'cartao' then v_calc := arred(v_calc / (1 - l.taxa_cartao / 100), l.arredondar); end if;
    v_liq := v_preco * (1 - l.imposto / 100) * (case when p_pagamento = 'cartao' then 1 - l.taxa_cartao / 100 else 1 end);
    v_lucro := (v_liq - v_custo) * v_qtd;

    insert into venda_itens (venda_id, loja_id, produto_id, qtd, preco, custo_unit, calc, lucro)
    values (v_venda, p_loja, p.id, v_qtd, v_preco, round(v_custo, 2), v_calc, round(v_lucro, 2));
    insert into movimentos (loja_id, produto_id, tipo, qtd, ref)
    values (p_loja, p.id, 'venda', -v_qtd, 'Venda #' || v_num);
    v_total := v_total + v_preco * v_qtd; v_lucro_total := v_lucro_total + v_lucro;
  end loop;

  update vendas set total = round(v_total, 2), lucro = round(v_lucro_total, 2) where id = v_venda;
  return jsonb_build_object('id', v_venda, 'numero', v_num, 'total', round(v_total, 2), 'lucro', round(v_lucro_total, 2), 'cliente_id', v_cli);
end $$;

------------------------------------------------------------------
-- Visões
------------------------------------------------------------------
create view public.produtos_estoque with (security_invoker = true) as
select p.*,
  coalesce((select sum(m.qtd) from movimentos m where m.produto_id = p.id), 0)::int as estoque,
  (select max(m.data) from movimentos m where m.produto_id = p.id and m.tipo = 'venda') as ultima_venda,
  (select min(m.data) from movimentos m where m.produto_id = p.id and m.tipo = 'entrada') as primeira_entrada
from produtos p;

-- Resumo de todas as lojas para o painel master.
create or replace function public.master_lojas() returns table (
  id uuid, nome text, plano text, ativa boolean, criado_em timestamptz,
  dona_email text, usuarias bigint, pecas bigint, vendas_30d bigint, faturamento_30d numeric, ultima_atividade timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not eh_master() then raise exception 'Acesso restrito à administração.'; end if;
  return query
  select l.id, l.nome, l.plano, l.ativa, l.criado_em,
    (select email from perfis where perfis.id = l.dona),
    (select count(*) from membros m where m.loja_id = l.id),
    (select count(*) from produtos p where p.loja_id = l.id and p.ativo),
    (select count(*) from vendas v where v.loja_id = l.id and v.data >= current_date - 30),
    (select coalesce(sum(v.total), 0) from vendas v where v.loja_id = l.id and v.data >= current_date - 30),
    (select max(a.em) from auditoria a where a.loja_id = l.id)
  from lojas l order by l.criado_em desc;
end $$;

------------------------------------------------------------------
-- RLS
------------------------------------------------------------------
alter table public.planos      enable row level security;
alter table public.masters     enable row level security;
alter table public.perfis      enable row level security;
alter table public.lojas       enable row level security;
alter table public.membros     enable row level security;
alter table public.convites    enable row level security;
alter table public.insumos     enable row level security;
alter table public.produtos    enable row level security;
alter table public.clientes    enable row level security;
alter table public.vendas      enable row level security;
alter table public.venda_itens enable row level security;
alter table public.movimentos  enable row level security;
alter table public.auditoria   enable row level security;

create policy planos_ler on public.planos for select to anon, authenticated using (true);

create policy masters_ler on public.masters for select to authenticated using (user_id = auth.uid());

create policy perfis_ler on public.perfis for select to authenticated
  using (id = auth.uid() or mesma_loja(id) or eh_master());
create policy perfis_editar on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy lojas_ler on public.lojas for select to authenticated
  using (exists (select 1 from membros m where m.loja_id = lojas.id and m.user_id = auth.uid()) or eh_master());
create policy lojas_editar on public.lojas for update to authenticated
  using (eh_dona(id) or eh_master()) with check (eh_dona(id) or eh_master());

create policy membros_ler on public.membros for select to authenticated
  using (user_id = auth.uid() or eh_membro(loja_id) or eh_master());
create policy membros_papel on public.membros for update to authenticated
  using (eh_dona(loja_id) and user_id <> auth.uid()) with check (eh_dona(loja_id));
create policy membros_remover on public.membros for delete to authenticated
  using ((eh_dona(loja_id) and user_id <> auth.uid()) or eh_master());

create policy convites_ler on public.convites for select to authenticated using (eh_dona(loja_id) or eh_master());
create policy convites_criar on public.convites for insert to authenticated with check (eh_dona(loja_id));
create policy convites_apagar on public.convites for delete to authenticated using (eh_dona(loja_id));

create policy insumos_ler on public.insumos for select to authenticated using (eh_membro(loja_id) or eh_master());
create policy insumos_criar on public.insumos for insert to authenticated with check (eh_dona(loja_id));
create policy insumos_editar on public.insumos for update to authenticated using (eh_dona(loja_id)) with check (eh_dona(loja_id));
create policy insumos_apagar on public.insumos for delete to authenticated using (eh_dona(loja_id));

create policy produtos_ler on public.produtos for select to authenticated using (eh_membro(loja_id) or eh_master());
create policy produtos_criar on public.produtos for insert to authenticated with check (eh_dona(loja_id));
create policy produtos_editar on public.produtos for update to authenticated using (eh_dona(loja_id)) with check (eh_dona(loja_id));

create policy clientes_ler on public.clientes for select to authenticated using (eh_membro(loja_id) or eh_master());
create policy clientes_criar on public.clientes for insert to authenticated with check (eh_membro(loja_id));
create policy clientes_editar on public.clientes for update to authenticated using (eh_membro(loja_id)) with check (eh_membro(loja_id));

create policy vendas_ler on public.vendas for select to authenticated using (eh_membro(loja_id) or eh_master());
create policy itens_ler on public.venda_itens for select to authenticated using (eh_membro(loja_id) or eh_master());

create policy mov_ler on public.movimentos for select to authenticated using (eh_membro(loja_id) or eh_master());
create policy mov_criar on public.movimentos for insert to authenticated
  with check (eh_membro(loja_id) and tipo in ('entrada','ajuste')
              and exists (select 1 from produtos p where p.id = produto_id and p.loja_id = movimentos.loja_id));

create policy auditoria_ler on public.auditoria for select to authenticated using (eh_dona(loja_id) or eh_master());

-- Ninguém de fora acessa nada; ninguém escreve no histórico.
revoke all on all tables in schema public from anon;
grant select on public.planos to anon;
revoke insert, update, delete, truncate on public.auditoria, public.masters, public.planos from authenticated;
revoke insert, update, delete on public.vendas, public.venda_itens from authenticated;
revoke execute on function public.registrar_venda(uuid,bigint,text,text,text,int,jsonb) from anon, public;
revoke execute on function public.criar_loja(text) from anon, public;
revoke execute on function public.master_lojas() from anon, public;
revoke execute on function public.insumos_padrao(uuid) from anon, authenticated, public;
revoke execute on function public.novo_usuario() from anon, authenticated, public;
grant execute on function public.registrar_venda(uuid,bigint,text,text,text,int,jsonb) to authenticated;
grant execute on function public.criar_loja(text) to authenticated;
grant execute on function public.master_lojas() to authenticated;

-- Depois de criar a sua conta no site, torne-se master rodando (com o seu e-mail):
-- insert into public.masters (user_id) select id from auth.users where email = 'seu-email@exemplo.com';
