-- Banco de dados da lista de presentes: Diandra & Guilherme
-- Execute este arquivo UMA VEZ em Supabase > SQL Editor > New query > Run.
-- Reexecutar mantém reservas existentes: o catálogo usa ON CONFLICT DO NOTHING.
-- Para alterar presentes após a instalação, veja o LEIA-ME.md.

-- Uma linha por tipo de presente. Não armazenamos nomes, emails, telefones ou IPs.
create table if not exists public.presentes (
  id integer primary key,
  nome text not null check (length(trim(nome)) > 0)
);

-- Código secreto para cancelar; nunca é publicado na lista.
create table if not exists public.reservas (
  presente_id integer primary key references public.presentes(id) on delete cascade,
  codigo uuid not null unique default gen_random_uuid(),
  reservado_em timestamptz not null default now()
);

-- Ative RLS e bloqueie completamente o acesso direto das chaves públicas.
alter table public.presentes enable row level security;
alter table public.reservas enable row level security;
revoke all on table public.presentes, public.reservas from PUBLIC, anon, authenticated;

-- Função pública limitada: lista só nomes e status; nunca expõe códigos.
create or replace function public.listar_presentes()
returns table(id integer, nome text, reservado boolean)
language sql stable security definer
set search_path = ''
as $$
  select p.id, p.nome, (r.presente_id is not null) as reservado
  from public.presentes as p
  left join public.reservas as r on r.presente_id = p.id
  order by p.id;
$$;

-- Reserva atômica: a PRIMARY KEY impede a mesma escolha simultânea.
-- Se o presente já tiver reserva, devolve NULL; senão, devolve UUID privado.
create or replace function public.reservar_presente(p_presente_id integer)
returns uuid
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_codigo uuid;
begin
  insert into public.reservas (presente_id)
  select p.id from public.presentes as p where p.id = p_presente_id
  on conflict (presente_id) do nothing
  returning codigo into v_codigo;
  return v_codigo;
end;
$$;

-- Só quem conhece o UUID da escolha consegue desfazer a reserva.
create or replace function public.cancelar_reserva(p_presente_id integer, p_codigo uuid)
returns boolean
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_id integer;
begin
  delete from public.reservas
  where presente_id = p_presente_id and codigo = p_codigo
  returning presente_id into v_id;
  return v_id is not null;
end;
$$;

-- Por segurança, conceda ao público somente a execução das 3 funções.
revoke all on function public.listar_presentes() from PUBLIC, anon, authenticated;
revoke all on function public.reservar_presente(integer) from PUBLIC, anon, authenticated;
revoke all on function public.cancelar_reserva(integer, uuid) from PUBLIC, anon, authenticated;
grant execute on function public.listar_presentes() to anon;
grant execute on function public.reservar_presente(integer) to anon;
grant execute on function public.cancelar_reserva(integer, uuid) to anon;

-- Insere o catálogo original sem apagar o que já foi reservado.
insert into public.presentes (id, nome) values
  (1, 'Açucareiro'),
  (2, 'Air fryer'),
  (3, 'Almofadas'),
  (4, 'Aromatizador de ambiente'),
  (5, 'Assadeira de vidro'),
  (6, 'Cabides'),
  (7, 'Cestos organizadores'),
  (8, 'Chaleira elétrica'),
  (9, 'Conjunto de sobremesa'),
  (10, 'Copos'),
  (11, 'Edredom'),
  (12, 'Escorredor de massa'),
  (13, 'Escorredor de louças'),
  (14, 'Espelho'),
  (15, 'Faqueiro'),
  (16, 'Forma de gelo'),
  (17, 'Formas de bolo'),
  (18, 'Frigideira'),
  (19, 'Fronha e lençol com elástico (cama de casal normal)'),
  (20, 'Jogo americano'),
  (21, 'Jogo de lençol completo'),
  (22, 'Jogo de taça'),
  (23, 'Kit saboneteira banheiro'),
  (24, 'Manta de microfibra'),
  (25, 'Manta para sofá'),
  (26, 'Panelas de cerâmica/Indução'),
  (27, 'Pano de prato'),
  (28, 'Pegador de massa/salada'),
  (29, 'Petisqueira'),
  (30, 'Porta temperos'),
  (31, 'Potes de armazenamento'),
  (32, 'Protetor de colchão'),
  (33, 'Saleiro'),
  (34, 'Sanduicheira'),
  (35, 'Suporte de detergente'),
  (36, 'Tábua de cortar carne'),
  (37, 'Talheres'),
  (38, 'Tapete'),
  (39, 'Tapete para banheiro'),
  (40, 'Toalhas de banho'),
  (41, 'Toalhas de mesa'),
  (42, 'Toalhas de rosto'),
  (43, 'Xícaras e Pires')
on conflict (id) do nothing;
