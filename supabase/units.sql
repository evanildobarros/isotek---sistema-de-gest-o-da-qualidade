-- 1. Criar tabela de Unidades (Matriz e Filiais)
create table public.units (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) not null, -- Vincula à empresa mãe
  name text not null, -- Ex: "Matriz São Luís", "Filial Imperatriz"
  code text, -- Ex: "UNI-01"
  is_headquarters boolean default false, -- Se é a Matriz
  cnpj text,
  address text,
  city text,
  state text,
  created_at timestamptz default now()
);

-- 2. Atualizar a tabela de Perfis para saber onde o funcionário trabalha
-- (Adicionando a coluna unit_id)
alter table public.profiles 
add column unit_id uuid references public.units(id);

-- 3. Política de Segurança (RLS)
alter table public.units enable row level security;

create policy "Ver unidades da minha empresa"
on public.units for all
using (
  company_id in (
    select company_id from public.profiles where id = auth.uid()
  )
);
