-- EstoqueOn: recursos do aplicativo de celular.
-- Fluxo de caixa, cadastro completo de clientes, pós-venda, importação de nota fiscal (NF-e) e fotos das peças.

------------------------------------------------------------------
-- Peças e clientes: campos novos
------------------------------------------------------------------
alter table public.produtos
  add column if not exists foto_url text check (foto_url is null or char_length(foto_url) <= 500),
  add column if not exists ean text not null default '' check (char_length(ean) <= 20);
create index if not exists produtos_sku_fornecedor on public.produtos (loja_id, sku_fornecedor) where sku_fornecedor <> '';
create index if not exists produtos_ean on public.produtos (loja_id, ean) where ean <> '';

-- a visão precisa ser recriada para trazer as colunas novas
drop view if exists public.produtos_estoque;
create view public.produtos_estoque with (security_invoker = true) as
select p.*,
  coalesce((select sum(m.qtd) from public.movimentos m where m.produto_id = p.id), 0)::int as estoque,
  (select max(m.data) from public.movimentos m where m.produto_id = p.id and m.tipo = 'venda') as ultima_venda,
  (select min(m.data) from public.movimentos m where m.produto_id = p.id and m.tipo = 'entrada') as primeira_entrada
from public.produtos p;

alter table public.clientes
  add column if not exists aniversario date,
  add column if not exists instagram text not null default '' check (char_length(instagram) <= 40),
  add column if not exists observacoes text not null default '' check (char_length(observacoes) <= 500),
  add column if not exists aceita_ofertas boolean not null default true;

------------------------------------------------------------------
-- Fluxo de caixa
------------------------------------------------------------------
create table public.lancamentos (
  id bigint generated always as identity primary key,
  loja_id uuid not null references public.lojas on delete cascade,
  data date not null default current_date,
  tipo text not null check (tipo in ('entrada','saida')),
  categoria text not null check (char_length(categoria) between 1 and 40),
  descricao text not null default '' check (char_length(descricao) <= 120),
  valor numeric(12,2) not null check (valor > 0),
  forma text not null default 'pix' check (forma in ('pix','dinheiro','cartao','boleto','outro')),
  venda_id bigint references public.vendas on delete set null,
  nota_id bigint,
  usuario uuid default auth.uid() references auth.users on delete set null,
  criado_em timestamptz not null default now()
);
create index on public.lancamentos (loja_id, data);

------------------------------------------------------------------
-- Pós-venda: contatos feitos com as clientes
------------------------------------------------------------------
create table public.contatos (
  id bigint generated always as identity primary key,
  loja_id uuid not null references public.lojas on delete cascade,
  cliente_id bigint not null references public.clientes on delete cascade,
  tipo text not null check (tipo in ('agradecimento','oferta','aniversario','reativacao','outro')),
  mensagem text not null default '' check (char_length(mensagem) <= 1000),
  usuario uuid default auth.uid() references auth.users on delete set null,
  criado_em timestamptz not null default now()
);
create index on public.contatos (loja_id, cliente_id, criado_em desc);

------------------------------------------------------------------
-- Notas fiscais importadas
------------------------------------------------------------------
create table public.notas (
  id bigint generated always as identity primary key,
  loja_id uuid not null references public.lojas on delete cascade,
  chave text not null check (chave ~ '^[0-9]{44}$'),
  numero text not null default '',
  fornecedor text not null default '',
  cnpj text not null default '',
  emissao date,
  valor_total numeric(12,2) not null default 0,
  itens jsonb not null default '[]',
  usuario uuid default auth.uid() references auth.users on delete set null,
  criado_em timestamptz not null default now(),
  unique (loja_id, chave)
);
alter table public.lancamentos add constraint lancamentos_nota_fk foreign key (nota_id) references public.notas on delete set null;

-- histórico também para as tabelas novas
create trigger auditar after insert or update or delete on public.lancamentos for each row execute function public.fn_auditoria();
create trigger auditar after insert or update or delete on public.contatos for each row execute function public.fn_auditoria();
create trigger auditar after insert or update or delete on public.notas for each row execute function public.fn_auditoria();

------------------------------------------------------------------
-- Venda agora também lança no caixa (e a taxa do cartão como saída)
------------------------------------------------------------------
drop function if exists public.registrar_venda(uuid,bigint,text,text,text,int,jsonb);
create or replace function public.registrar_venda(
  p_loja uuid, p_cliente_id bigint, p_cliente_nome text, p_cliente_whatsapp text,
  p_pagamento text, p_parcelas int, p_itens jsonb, p_forma text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  l lojas%rowtype; v_rateio numeric; v_cli bigint := p_cliente_id; v_venda bigint; v_num int;
  it jsonb; p produtos%rowtype; v_qtd int; v_preco numeric; v_est int;
  v_custo numeric; v_calc numeric; v_liq numeric; v_lucro numeric;
  v_total numeric := 0; v_lucro_total numeric := 0; v_forma text;
begin
  if not eh_membro(p_loja) then raise exception 'Sem acesso a esta loja.'; end if;
  if p_pagamento not in ('vista','cartao') then raise exception 'Forma de pagamento inválida.'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'A venda precisa de ao menos uma peça.';
  end if;
  v_forma := case when p_pagamento = 'cartao' then 'cartao'
                  when p_forma in ('pix','dinheiro','boleto','outro') then p_forma else 'pix' end;
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

  if v_total > 0 then
    insert into lancamentos (loja_id, tipo, categoria, descricao, valor, forma, venda_id)
    values (p_loja, 'entrada', 'Venda', 'Venda #' || v_num, round(v_total, 2), v_forma, v_venda);
    if p_pagamento = 'cartao' and l.taxa_cartao > 0 then
      insert into lancamentos (loja_id, tipo, categoria, descricao, valor, forma, venda_id)
      values (p_loja, 'saida', 'Taxa da maquininha', 'Venda #' || v_num || ' (' || l.taxa_cartao || '%)',
              round(v_total * l.taxa_cartao / 100, 2), 'cartao', v_venda);
    end if;
  end if;
  return jsonb_build_object('id', v_venda, 'numero', v_num, 'total', round(v_total, 2), 'lucro', round(v_lucro_total, 2), 'cliente_id', v_cli);
end $$;

------------------------------------------------------------------
-- Importar nota fiscal (NF-e): cria/associa peças, dá entrada no estoque e lança a compra no caixa
------------------------------------------------------------------
-- p_itens: [{ "produto_id": 12 } ou { "novo": { "nome", "categoria", "sku_fornecedor", "ean" } },
--            "qtd": 3, "custo": 18.5, "codigo": "RV-2210", "descricao": "Brinco..." }]
create or replace function public.importar_nota(
  p_loja uuid, p_nota jsonb, p_itens jsonb, p_atualizar_custo boolean default true, p_lancar_caixa boolean default true
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_nota bigint; it jsonb; v_pid bigint; v_qtd int; v_custo numeric; v_novo jsonb;
  v_sku text; v_n int; v_pecas int := 0; v_criadas int := 0; v_valor numeric;
  v_forn text := left(coalesce(p_nota->>'fornecedor', ''), 60);
begin
  if not eh_dona(p_loja) then raise exception 'Só a dona da loja importa notas fiscais.'; end if;
  if coalesce(p_nota->>'chave', '') !~ '^[0-9]{44}$' then raise exception 'Chave de acesso da nota inválida.'; end if;
  if exists (select 1 from notas where loja_id = p_loja and chave = p_nota->>'chave') then
    raise exception 'Esta nota já foi importada.';
  end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Escolha ao menos um item da nota.';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_loja::text));

  insert into notas (loja_id, chave, numero, fornecedor, cnpj, emissao, valor_total, itens)
  values (p_loja, p_nota->>'chave', left(coalesce(p_nota->>'numero', ''), 20), v_forn,
          regexp_replace(coalesce(p_nota->>'cnpj', ''), '\D', '', 'g'),
          nullif(p_nota->>'emissao', '')::date, coalesce((p_nota->>'valor_total')::numeric, 0), p_itens)
  returning id into v_nota;

  for it in select * from jsonb_array_elements(p_itens) loop
    v_qtd := (it->>'qtd')::int; v_custo := round((it->>'custo')::numeric, 2);
    if v_qtd is null or v_qtd <= 0 or v_custo is null or v_custo < 0 then raise exception 'Quantidade ou custo inválido em %.', it->>'descricao'; end if;
    v_pid := nullif(it->>'produto_id', '')::bigint;
    if v_pid is not null then
      if not exists (select 1 from produtos where id = v_pid and loja_id = p_loja) then raise exception 'Peça não encontrada.'; end if;
      if p_atualizar_custo then update produtos set custo = v_custo where id = v_pid and custo <> v_custo; end if;
      update produtos set
        sku_fornecedor = case when sku_fornecedor = '' then left(coalesce(it->>'codigo', ''), 40) else sku_fornecedor end,
        ean = case when ean = '' then left(coalesce(it->'novo'->>'ean', it->>'ean', ''), 20) else ean end,
        fornecedor = case when fornecedor = '' then v_forn else fornecedor end,
        ativo = true
      where id = v_pid;
    else
      v_novo := it->'novo';
      if v_novo is null or coalesce(trim(v_novo->>'nome'), '') = '' then raise exception 'Item sem peça associada.'; end if;
      select coalesce(max(nullif(regexp_replace(sku, '\D', '', 'g'), '')::int), 0) + 1 into v_n from produtos where loja_id = p_loja;
      v_sku := 'EO-' || lpad(v_n::text, 4, '0');
      insert into produtos (loja_id, sku, nome, categoria, fornecedor, sku_fornecedor, ean, custo)
      values (p_loja, v_sku, left(trim(v_novo->>'nome'), 80), left(coalesce(v_novo->>'categoria', ''), 40), v_forn,
              left(coalesce(v_novo->>'sku_fornecedor', it->>'codigo', ''), 40), left(coalesce(v_novo->>'ean', ''), 20), v_custo)
      returning id into v_pid;
      v_criadas := v_criadas + 1;
    end if;
    insert into movimentos (loja_id, produto_id, tipo, qtd, ref)
    values (p_loja, v_pid, 'entrada', v_qtd, left('NF ' || coalesce(p_nota->>'numero', '') || ' ' || v_forn, 80));
    v_pecas := v_pecas + v_qtd;
  end loop;

  if p_lancar_caixa then
    v_valor := coalesce(nullif((p_nota->>'valor_total')::numeric, 0),
                        (select sum((x->>'qtd')::int * (x->>'custo')::numeric) from jsonb_array_elements(p_itens) x));
    if v_valor > 0 then
      insert into lancamentos (loja_id, tipo, categoria, descricao, valor, forma, nota_id, data)
      values (p_loja, 'saida', 'Compra de mercadoria', left('NF ' || coalesce(p_nota->>'numero', '') || ' · ' || v_forn, 120),
              round(v_valor, 2), 'boleto', v_nota, coalesce(nullif(p_nota->>'emissao', '')::date, current_date));
    end if;
  end if;
  return jsonb_build_object('nota_id', v_nota, 'pecas', v_pecas, 'criadas', v_criadas);
end $$;

------------------------------------------------------------------
-- Permissões das tabelas novas
------------------------------------------------------------------
alter table public.lancamentos enable row level security;
alter table public.contatos enable row level security;
alter table public.notas enable row level security;

create policy lanc_ler on public.lancamentos for select to authenticated using (eh_membro(loja_id) or eh_master());
create policy lanc_criar on public.lancamentos for insert to authenticated
  with check (eh_membro(loja_id) and venda_id is null and nota_id is null);
create policy lanc_editar on public.lancamentos for update to authenticated
  using (eh_dona(loja_id) and venda_id is null) with check (eh_dona(loja_id) and venda_id is null);
create policy lanc_apagar on public.lancamentos for delete to authenticated using (eh_dona(loja_id) and venda_id is null);

create policy contatos_ler on public.contatos for select to authenticated using (eh_membro(loja_id) or eh_master());
create policy contatos_criar on public.contatos for insert to authenticated
  with check (eh_membro(loja_id) and exists (select 1 from clientes c where c.id = cliente_id and c.loja_id = contatos.loja_id));

create policy notas_ler on public.notas for select to authenticated using (eh_membro(loja_id) or eh_master());

revoke insert, update, delete on public.notas from authenticated;
revoke all on public.lancamentos, public.contatos, public.notas from anon;
revoke execute on function public.registrar_venda(uuid,bigint,text,text,text,int,jsonb,text) from anon, public;
revoke execute on function public.importar_nota(uuid,jsonb,jsonb,boolean,boolean) from anon, public;
grant execute on function public.registrar_venda(uuid,bigint,text,text,text,int,jsonb,text) to authenticated;
grant execute on function public.importar_nota(uuid,jsonb,jsonb,boolean,boolean) to authenticated;
grant select on public.produtos_estoque to authenticated;
revoke all on public.produtos_estoque from anon;

------------------------------------------------------------------
-- Fotos das peças (Storage). Pasta = id da loja. Leitura pública, envio só da dona.
------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy fotos_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and public.eh_dona(((storage.foldername(name))[1])::uuid));
create policy fotos_trocar on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and public.eh_dona(((storage.foldername(name))[1])::uuid));
create policy fotos_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and public.eh_dona(((storage.foldername(name))[1])::uuid));
