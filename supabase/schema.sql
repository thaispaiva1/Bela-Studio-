-- ==============================================================================
-- SCHEMA SUPABASE: SISTEMA DE AGENDAMENTO MANICURE (BELLA STUDIO)
-- Políticas de Segurança RLS (Row Level Security) e Armazenamento (Storage)
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
create extension if not exists "uuid-ossp";

-- 2. TABELA: SERVIÇOS (Catálogo de Procedimentos)
create table if not exists public.services (
    id text primary key,
    name text not null,
    description text default '',
    category text not null check (category in ('tradicional', 'alongamento', 'spa', 'arte')),
    duration_minutes integer not null default 45,
    price numeric(10, 2) not null default 0.00,
    popular boolean default false,
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em services
alter table public.services enable row level security;

-- Limpar políticas antigas se existirem
drop policy if exists "Serviços visíveis publicamente" on public.services;
drop policy if exists "Gestão total de serviços" on public.services;

-- Políticas de RLS para services:
create policy "Serviços visíveis publicamente"
    on public.services for select
    using (true);

create policy "Gestão total de serviços"
    on public.services for all
    using (true)
    with check (true);


-- 3. TABELA: CONFIGURAÇÕES DO STUDIO
create table if not exists public.settings (
    id text primary key default 'default_studio',
    studio_name text not null default 'Bella Studio & Nail Designer',
    owner_name text not null default 'Isabella Martins',
    phone text not null default '11987654321',
    instagram text default '@bellastudio.unhas',
    address text not null default 'Rua das Flores, 420 - Sala 03',
    neighborhood text default 'Jardim Primavera',
    city text default 'São Paulo - SP',
    admin_password text not null default 'admin',
    open_time text not null default '09:00',
    close_time text not null default '19:00',
    interval_minutes integer not null default 30,
    working_days integer[] default '{1,2,3,4,5,6}',
    lunch_break_start text default '12:30',
    lunch_break_end text default '13:30',
    deposit_required boolean default true,
    deposit_percentage numeric(5, 2) default 30.00,
    pix_key text default '11987654321',
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS em settings
alter table public.settings enable row level security;

drop policy if exists "Configurações visíveis publicamente para horários" on public.settings;
drop policy if exists "Atualização de configurações do salão" on public.settings;

create policy "Configurações visíveis publicamente para horários"
    on public.settings for select
    using (true);

create policy "Atualização de configurações do salão"
    on public.settings for all
    using (true)
    with check (true);


-- 4. TABELA: BLOQUEIOS & FOLGAS
create table if not exists public.blocked_slots (
    id text primary key,
    date date not null,
    time text, -- null ou 'all_day' para dia inteiro
    reason text default 'Horário Bloqueado',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em blocked_slots
alter table public.blocked_slots enable row level security;

drop policy if exists "Bloqueios visíveis para cálculo de horários livres" on public.blocked_slots;
drop policy if exists "Gestão de bloqueios pelo painel" on public.blocked_slots;

create policy "Bloqueios visíveis para cálculo de horários livres"
    on public.blocked_slots for select
    using (true);

create policy "Gestão de bloqueios pelo painel"
    on public.blocked_slots for all
    using (true)
    with check (true);


-- 5. TABELA: AGENDAMENTOS (Appointments)
create table if not exists public.appointments (
    id text primary key,
    client_name text not null,
    client_phone text not null,
    client_email text,
    service_ids text[] not null,
    service_names text[] not null,
    total_price numeric(10, 2) not null default 0.00,
    total_duration integer not null default 60,
    date date not null,
    time text not null,
    notes text default '',
    status text not null check (status in ('pendente', 'confirmado', 'concluido', 'cancelado')) default 'pendente',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Índices de alta performance para busca e filtros de agenda
create index if not exists idx_appointments_date on public.appointments(date);
create index if not exists idx_appointments_phone on public.appointments(client_phone);
create index if not exists idx_appointments_status on public.appointments(status);

-- Habilitar RLS em appointments
alter table public.appointments enable row level security;

drop policy if exists "Clientes podem criar agendamentos" on public.appointments;
drop policy if exists "Leitura de agendamentos" on public.appointments;
drop policy if exists "Atualização de agendamentos" on public.appointments;
drop policy if exists "Exclusão de agendamentos pelo painel" on public.appointments;

-- Política 1: Clientes podem inserir novos agendamentos online
create policy "Clientes podem criar agendamentos"
    on public.appointments for insert
    with check (true);

-- Política 2: Leitura de agendamentos
create policy "Leitura de agendamentos"
    on public.appointments for select
    using (true);

-- Política 3: Atualização de agendamentos (status, confirmações e cancelamentos)
create policy "Atualização de agendamentos"
    on public.appointments for update
    using (true)
    with check (true);

-- Política 4: Exclusão de agendamentos
create policy "Exclusão de agendamentos pelo painel"
    on public.appointments for delete
    using (true);


-- 6. POLÍTICAS DE ARMAZENAMENTO DE ARQUIVOS (STORAGE BUCKETS)
-- Criação do Bucket para fotos e comprovantes (se o schema storage existir)
insert into storage.buckets (id, name, public)
values ('agendamento-arquivos', 'agendamento-arquivos', true)
on conflict (id) do nothing;

-- Nota: No Supabase, o RLS da tabela 'storage.objects' já vem ativado por padrão
-- e é de propriedade do 'supabase_storage_admin'. Por isso não se usa 'alter table storage.objects'.

-- Limpar políticas antigas de storage se existirem
drop policy if exists "Arquivos públicos para visualização" on storage.objects;
drop policy if exists "Permitir upload no bucket de agendamento" on storage.objects;
drop policy if exists "Permitir exclusão de arquivos no bucket" on storage.objects;

-- Política de Storage 1: Acesso público para visualização de arquivos
create policy "Arquivos públicos para visualização"
    on storage.objects for select
    using (bucket_id = 'agendamento-arquivos');

-- Política de Storage 2: Upload permitido para clientes e dona
create policy "Permitir upload no bucket de agendamento"
    on storage.objects for insert
    with check (bucket_id = 'agendamento-arquivos');

-- Política de Storage 3: Atualização e exclusão de arquivos no bucket
create policy "Permitir exclusão de arquivos no bucket"
    on storage.objects for delete
    using (bucket_id = 'agendamento-arquivos');


-- 7. SEED INICIAL DE DADOS (Serviços e Configurações Padrão)
insert into public.settings (
    id, studio_name, owner_name, phone, instagram, address, neighborhood, city, admin_password, open_time, close_time, interval_minutes, working_days, lunch_break_start, lunch_break_end, deposit_required, deposit_percentage, pix_key
) values (
    'default_studio',
    'Bella Studio & Nail Designer',
    'Isabella Martins',
    '11987654321',
    '@bellastudio.unhas',
    'Rua das Flores, 420 - Sala 03',
    'Jardim Primavera',
    'São Paulo - SP',
    'admin',
    '09:00',
    '19:00',
    30,
    '{1,2,3,4,5,6}',
    '12:30',
    '13:30',
    true,
    30.00,
    '11987654321'
) on conflict (id) do nothing;

insert into public.services (id, name, description, category, duration_minutes, price, popular, active)
values
    ('srv-1', 'Manicure Tradicional (Cutilagem & Esmaltação)', 'Cutilagem funda e acabamento impecável com esmaltação comum.', 'tradicional', 45, 35.00, true, true),
    ('srv-2', 'Pedicure Completo & Spa dos Pés', 'Higienização, lixamento, esfoliação e hidratação profunda.', 'spa', 50, 45.00, true, true),
    ('srv-3', 'Combo Mão & Pé Completo', 'Cutilagem e esmaltação completa para mãos e pés.', 'tradicional', 80, 70.00, true, true),
    ('srv-4', 'Esmaltação em Gel (Longa Duração)', 'Secagem em cabine LED/UV. Dura até 21 dias intacta.', 'tradicional', 60, 65.00, true, true),
    ('srv-5', 'Blindagem de Diamante / Banho de Gel', 'Camada protetora para evitar quebras da unha natural.', 'alongamento', 60, 75.00, false, true),
    ('srv-6', 'Alongamento em Fibra de Vidro (Aplicação)', 'Unhas com aspecto natural, resistentes e finas.', 'alongamento', 120, 150.00, true, true),
    ('srv-7', 'Manutenção de Fibra de Vidro / Gel', 'Nivelamento e reposição com novo acabamento e cutilagem.', 'alongamento', 90, 95.00, false, true),
    ('srv-8', 'Alongamento em Gel Moldado / Tips', 'Extensão com simetria e resistência perfeitas.', 'alongamento', 120, 140.00, false, true),
    ('srv-9', 'Nail Art / Francesinha Reversa / Decoração', 'Arte personalizada, francesinha sorriso ou pedrarias.', 'arte', 25, 25.00, false, true),
    ('srv-10', 'Remoção Segura de Alongamento', 'Remoção cuidadosa sem danificar a lâmina ungueal.', 'spa', 45, 45.00, false, true)
on conflict (id) do nothing;
