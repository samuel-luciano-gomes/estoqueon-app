-- EstoqueOn: prazo da sessão de login.
-- O token de acesso dura 1 hora e é renovado sozinho; sem isto, o login nunca venceria.
-- Aqui o banco passa a recusar os dados da loja quando a sessão:
--   * foi aberta há mais de 12 horas (é preciso entrar de novo), ou
--   * foi encerrada (Sair, "Sair de todos os aparelhos", troca de senha) — vale na hora,
--     sem esperar o token de 1 hora vencer.
-- A saída por inatividade (30 minutos) é feita pelo site, que também chama sessao_ok().

create or replace function public.sessao_valida() returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when auth.uid() is null then false
    else coalesce((
      select s.created_at > now() - interval '12 hours'
      from auth.sessions s
      where s.id = nullif(auth.jwt()->>'session_id', '')::uuid
        and s.user_id = auth.uid()
        and (s.not_after is null or s.not_after > now())
    ), false)
  end;
$$;

-- Para o site perguntar se a sessão ainda vale (e mandar para o login se não valer).
create or replace function public.sessao_ok() returns boolean
language sql stable security definer set search_path = '' as $$ select public.sessao_valida(); $$;

-- As regras de acesso passam a exigir sessão válida.
create or replace function public.eh_master() returns boolean
language sql stable security definer set search_path = public as $$
  select sessao_valida() and exists (select 1 from masters where user_id = auth.uid());
$$;

create or replace function public.eh_membro(p_loja uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select sessao_valida() and exists (
    select 1 from membros m join lojas l on l.id = m.loja_id
    where m.loja_id = p_loja and m.user_id = auth.uid() and l.ativa);
$$;

create or replace function public.eh_dona(p_loja uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select sessao_valida() and exists (
    select 1 from membros m join lojas l on l.id = m.loja_id
    where m.loja_id = p_loja and m.user_id = auth.uid() and m.papel = 'dona' and l.ativa);
$$;

-- Lista de lojas e equipe também só com sessão válida.
drop policy if exists lojas_ler on public.lojas;
create policy lojas_ler on public.lojas for select to authenticated
  using (sessao_valida() and (exists (select 1 from membros m where m.loja_id = lojas.id and m.user_id = auth.uid()) or eh_master()));
drop policy if exists membros_ler on public.membros;
create policy membros_ler on public.membros for select to authenticated
  using (sessao_valida() and (user_id = auth.uid() or eh_membro(loja_id) or eh_master()));

revoke execute on function public.sessao_valida() from anon, public;
revoke execute on function public.sessao_ok() from anon, public;
grant execute on function public.sessao_valida() to authenticated;
grant execute on function public.sessao_ok() to authenticated;
