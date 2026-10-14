-- Docneo baseline schema. Review in a local Supabase environment before applying remotely.
begin;

create extension if not exists pgcrypto;

create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'de' check (locale in ('de', 'fr')),
  temporary_retention_hours integer not null default 24 check (temporary_retention_hours between 1 and 168),
  deletion_requested_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google_drive')),
  provider_subject text not null,
  status text not null default 'active' check (status in ('active', 'reconnect_required', 'revoked')),
  granted_scopes text[] not null default '{}',
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  encryption_key_version smallint not null default 1 check (encryption_key_version > 0),
  expires_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (user_id, provider),
  unique (provider, provider_subject)
);

create table public.organizational_entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('person', 'property', 'company', 'project')),
  name text not null check (char_length(name) between 1 and 160),
  description text check (description is null or char_length(description) <= 1000),
  identifiers jsonb not null default '{}'::jsonb check (jsonb_typeof(identifiers) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (user_id, entity_type, name)
);

create table public.destination_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connected_account_id uuid not null references public.connected_accounts(id) on delete cascade,
  entity_id uuid references public.organizational_entities(id) on delete set null,
  provider_folder_id text not null check (char_length(provider_folder_id) between 1 and 255),
  display_name text not null check (char_length(display_name) between 1 and 255),
  display_path text check (display_path is null or char_length(display_path) <= 1000),
  authorization_source text not null check (authorization_source in ('picker', 'app_created')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint folders_account_owner_fk foreign key (connected_account_id, user_id)
    references public.connected_accounts(id, user_id),
  constraint folders_entity_owner_fk foreign key (entity_id, user_id)
    references public.organizational_entities(id, user_id),
  unique (id, user_id),
  unique (user_id, connected_account_id, provider_folder_id)
);

create table public.organization_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  priority integer not null default 100 check (priority between 0 and 10000),
  conditions jsonb not null check (jsonb_typeof(conditions) = 'object'),
  destination_folder_id uuid not null references public.destination_folders(id) on delete restrict,
  is_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint rules_folder_owner_fk foreign key (destination_folder_id, user_id)
    references public.destination_folders(id, user_id)
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'validating', 'analyzing', 'awaiting_review', 'saving', 'completed', 'failed', 'cancelled')),
  source_media_type text not null,
  source_size_bytes bigint not null check (source_size_bytes > 0),
  temporary_object_key text check (temporary_object_key is null or char_length(temporary_object_key) <= 500),
  expires_at timestamptz not null,
  error_code text,
  attempts smallint not null default 0 check (attempts between 0 and 10),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  unique (id, user_id)
);

create table public.document_metadata (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  processing_job_id uuid references public.processing_jobs(id) on delete set null,
  related_entity_id uuid references public.organizational_entities(id) on delete set null,
  destination_folder_id uuid references public.destination_folders(id) on delete set null,
  document_type text not null check (char_length(document_type) between 1 and 100),
  issuer text check (issuer is null or char_length(issuer) <= 255),
  document_date date,
  invoice_number text check (invoice_number is null or char_length(invoice_number) <= 160),
  category text check (category is null or char_length(category) <= 100),
  final_filename text not null check (char_length(final_filename) between 1 and 255),
  provider_file_id text check (provider_file_id is null or char_length(provider_file_id) <= 255),
  provider_web_url text check (provider_web_url is null or char_length(provider_web_url) <= 2000),
  processing_status text not null check (processing_status in ('awaiting_review', 'saving', 'saved', 'failed')),
  confidence jsonb not null default '{}'::jsonb check (jsonb_typeof(confidence) = 'object'),
  user_confirmed_at timestamptz,
  saved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint documents_job_owner_fk foreign key (processing_job_id, user_id)
    references public.processing_jobs(id, user_id),
  constraint documents_entity_owner_fk foreign key (related_entity_id, user_id)
    references public.organizational_entities(id, user_id),
  constraint documents_folder_owner_fk foreign key (destination_folder_id, user_id)
    references public.destination_folders(id, user_id),
  unique (user_id, provider_file_id)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 120),
  target_type text check (target_type is null or char_length(target_type) <= 80),
  target_id uuid,
  request_id uuid,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.subscription_plans (
  id text primary key check (id in ('personal', 'property', 'pro', 'business')),
  display_name text not null,
  price_eur_cents integer not null check (price_eur_cents >= 0),
  is_provisional boolean not null default true,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id) on delete restrict,
  status text not null check (status in ('inactive', 'trialing', 'active', 'past_due', 'cancelled')),
  provider_customer_id text unique,
  provider_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index entities_owner_type_idx on public.organizational_entities(user_id, entity_type);
create index folders_owner_active_idx on public.destination_folders(user_id, is_active);
create index rules_owner_priority_idx on public.organization_rules(user_id, is_enabled, priority);
create index jobs_owner_created_idx on public.processing_jobs(user_id, created_at desc);
create index jobs_queue_idx on public.processing_jobs(status, created_at) where status in ('pending', 'validating', 'analyzing', 'saving');
create index jobs_expiry_idx on public.processing_jobs(expires_at) where temporary_object_key is not null;
create index documents_owner_created_idx on public.document_metadata(user_id, created_at desc);
create index documents_filters_idx on public.document_metadata(user_id, document_type, document_date desc);
create index documents_entity_idx on public.document_metadata(user_id, related_entity_id, created_at desc);
create index audit_owner_created_idx on public.audit_events(user_id, created_at desc);

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger accounts_updated before update on public.connected_accounts for each row execute function public.set_updated_at();
create trigger entities_updated before update on public.organizational_entities for each row execute function public.set_updated_at();
create trigger folders_updated before update on public.destination_folders for each row execute function public.set_updated_at();
create trigger rules_updated before update on public.organization_rules for each row execute function public.set_updated_at();
create trigger jobs_updated before update on public.processing_jobs for each row execute function public.set_updated_at();
create trigger documents_updated before update on public.document_metadata for each row execute function public.set_updated_at();
create trigger plans_updated before update on public.subscription_plans for each row execute function public.set_updated_at();
create trigger subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, locale)
  values (new.id, case when new.raw_user_meta_data ->> 'locale' = 'fr' then 'fr' else 'de' end);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.organizational_entities enable row level security;
alter table public.destination_folders enable row level security;
alter table public.organization_rules enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.document_metadata enable row level security;
alter table public.audit_events enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;

-- Future-feature tables are deliberately unavailable through the Data API until
-- their phases add narrowly scoped policies and grants. Trusted database roles
-- and the service role retain their normal administrative access.
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.connected_accounts from public, anon, authenticated;
revoke all on table public.organizational_entities from public, anon, authenticated;
revoke all on table public.destination_folders from public, anon, authenticated;
revoke all on table public.organization_rules from public, anon, authenticated;
revoke all on table public.processing_jobs from public, anon, authenticated;
revoke all on table public.document_metadata from public, anon, authenticated;
revoke all on table public.audit_events from public, anon, authenticated;
revoke all on sequence public.audit_events_id_seq from public, anon, authenticated;
revoke all on table public.subscriptions from public, anon, authenticated;

grant all on table public.profiles to service_role;
grant all on table public.connected_accounts to service_role;
grant all on table public.organizational_entities to service_role;
grant all on table public.destination_folders to service_role;
grant all on table public.organization_rules to service_role;
grant all on table public.processing_jobs to service_role;
grant all on table public.document_metadata to service_role;
grant all on table public.audit_events to service_role;
grant all on sequence public.audit_events_id_seq to service_role;
grant all on table public.subscriptions to service_role;

-- The inactive plan catalog is the only intentionally public table.
revoke all on table public.subscription_plans from public, anon, authenticated;
grant all on table public.subscription_plans to service_role;
grant select on table public.subscription_plans to anon, authenticated;
create policy plans_public_read on public.subscription_plans
for select to anon, authenticated using (is_active = true);

-- Provisional catalog only. Plans remain inactive and no billing records are created.
insert into public.subscription_plans (id, display_name, price_eur_cents, is_provisional, is_active) values
  ('personal', 'Personal', 590, true, false),
  ('property', 'Property', 1290, true, false),
  ('pro', 'Pro', 1990, true, false),
  ('business', 'Business', 3990, true, false);

commit;
