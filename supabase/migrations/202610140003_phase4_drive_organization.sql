-- Phase 4: server-owned Google Drive connections, onboarding drafts and action tracking.
-- Additive only: deployed Phase 1 and Phase 3 migrations remain immutable.
begin;

alter table public.connected_accounts add column provider_email text;
alter table public.connected_accounts add column root_folder_id text;
alter table public.connected_accounts add column root_folder_name text;
alter table public.connected_accounts add column pending_folder_id text;
alter table public.connected_accounts add column setup_status text not null default 'root_required'
  check (setup_status in ('root_required', 'onboarding', 'confirmation', 'complete'));
alter table public.connected_accounts add column disconnected_at timestamptz;
alter table public.connected_accounts add column pending_folder_type text generated always as ('pending_documents') stored;
alter table public.connected_accounts add column pending_folder_active boolean generated always as (true) stored;
alter table public.connected_accounts add column pending_folder_name text generated always as ('00_UNERLEDIGT') stored;
alter table public.connected_accounts add constraint connected_accounts_email_length
  check (provider_email is null or char_length(provider_email) between 3 and 254);
alter table public.connected_accounts add constraint connected_accounts_root_pair
  check ((root_folder_id is null) = (root_folder_name is null));
alter table public.connected_accounts add constraint connected_accounts_root_id_length
  check (root_folder_id is null or char_length(root_folder_id) between 1 and 255);
alter table public.connected_accounts add constraint connected_accounts_root_name_length
  check (root_folder_name is null or char_length(root_folder_name) between 1 and 255);
alter table public.connected_accounts add constraint connected_accounts_pending_id_length
  check (pending_folder_id is null or char_length(pending_folder_id) between 1 and 255);
alter table public.connected_accounts add constraint connected_accounts_complete_setup
  check (setup_status <> 'complete' or (root_folder_id is not null and pending_folder_id is not null));
alter table public.document_metadata add constraint documents_id_owner_unique unique (id, user_id);

alter table public.destination_folders add column parent_provider_folder_id text;
alter table public.destination_folders add column special_type text;
alter table public.destination_folders add constraint destination_parent_id_length
  check (parent_provider_folder_id is null or char_length(parent_provider_folder_id) between 1 and 255);
alter table public.destination_folders add constraint destination_special_type
  check (special_type is null or special_type = 'pending_documents');
alter table public.destination_folders add constraint pending_folder_shape
  check (
    special_type is null or (
      display_name = '00_UNERLEDIGT'
      and parent_provider_folder_id is not null
      and entity_id is null
      and is_active = true
    )
  );
alter table public.destination_folders add constraint destination_pending_reference_unique
  unique (user_id, connected_account_id, provider_folder_id, parent_provider_folder_id, special_type, is_active, display_name);
create unique index destination_one_active_pending_per_account
  on public.destination_folders (user_id, connected_account_id)
  where special_type = 'pending_documents' and is_active = true;

alter table public.connected_accounts add constraint connected_accounts_pending_folder_fk
  foreign key (
    user_id,
    id,
    pending_folder_id,
    root_folder_id,
    pending_folder_type,
    pending_folder_active,
    pending_folder_name
  ) references public.destination_folders (
    user_id,
    connected_account_id,
    provider_folder_id,
    parent_provider_folder_id,
    special_type,
    is_active,
    display_name
  ) deferrable initially deferred;

create table public.organization_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  setup_status text not null default 'draft' check (setup_status in ('draft', 'confirmed', 'complete')),
  setup_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_preferences_completion
    check (setup_status <> 'complete' or setup_completed_at is not null)
);

create table public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  current_step smallint not null default 0 check (current_step between 0 and 20),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'completed', 'abandoned')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.folder_structure_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  connected_account_id uuid not null references public.connected_accounts(id) on delete cascade,
  structure jsonb not null default '[]'::jsonb check (jsonb_typeof(structure) = 'array'),
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'applied')),
  confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint folder_drafts_account_owner_fk foreign key (connected_account_id, user_id)
    references public.connected_accounts(id, user_id),
  constraint folder_drafts_confirmation
    check (status not in ('confirmed', 'applied') or confirmed_at is not null)
);

create table public.drive_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connected_account_id uuid not null references public.connected_accounts(id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 200),
  operation_type text not null check (operation_type in ('create_root', 'select_root', 'create_folder', 'reuse_folder', 'repair_pending')),
  target_folder_id text,
  parent_folder_id text,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  attempt_count smallint not null default 0 check (attempt_count between 0 and 10),
  error_code text,
  confirmed_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint drive_operations_account_owner_fk foreign key (connected_account_id, user_id)
    references public.connected_accounts(id, user_id),
  constraint drive_operations_completion
    check (status <> 'completed' or completed_at is not null),
  unique (user_id, idempotency_key)
);

create table public.document_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_metadata_id uuid references public.document_metadata(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'completed', 'archived')),
  action_required boolean not null default false,
  action_description text check (action_description is null or char_length(action_description) <= 1000),
  due_date date,
  due_date_confirmed boolean not null default false,
  destination_folder_id uuid references public.destination_folders(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint document_actions_document_owner_fk foreign key (document_metadata_id, user_id)
    references public.document_metadata(id, user_id),
  constraint document_actions_folder_owner_fk foreign key (destination_folder_id, user_id)
    references public.destination_folders(id, user_id),
  constraint document_actions_confirmed_due_date
    check (not due_date_confirmed or due_date is not null),
  constraint document_actions_completion
    check (status not in ('completed', 'archived') or completed_at is not null)
);

create index drive_operations_owner_created_idx on public.drive_operations(user_id, created_at desc);
create index document_actions_owner_status_idx on public.document_actions(user_id, status, due_date);

create trigger organization_preferences_updated before update on public.organization_preferences for each row execute function public.set_updated_at();
create trigger onboarding_sessions_updated before update on public.onboarding_sessions for each row execute function public.set_updated_at();
create trigger folder_structure_drafts_updated before update on public.folder_structure_drafts for each row execute function public.set_updated_at();
create trigger drive_operations_updated before update on public.drive_operations for each row execute function public.set_updated_at();
create trigger document_actions_updated before update on public.document_actions for each row execute function public.set_updated_at();

create function public.change_drive_root(
  requested_user_id uuid,
  requested_account_id uuid,
  requested_root_folder_id text,
  requested_root_folder_name text
) returns void
language plpgsql
set search_path = ''
as $$
declare
  previous_root_folder_id text;
  previous_pending_folder_id text;
begin
  select account.root_folder_id, account.pending_folder_id
    into previous_root_folder_id, previous_pending_folder_id
  from public.connected_accounts as account
  where account.id = requested_account_id
    and account.user_id = requested_user_id
    and account.provider = 'google_drive'
    and account.status = 'active'
  for update;

  if not found then
    raise exception 'drive_account_not_found';
  end if;

  if previous_root_folder_id is not distinct from requested_root_folder_id then
    return;
  end if;

  update public.connected_accounts
  set root_folder_id = requested_root_folder_id,
      root_folder_name = requested_root_folder_name,
      pending_folder_id = null,
      setup_status = 'onboarding'
  where id = requested_account_id and user_id = requested_user_id;

  if previous_pending_folder_id is not null then
    update public.destination_folders
    set special_type = null,
        is_active = false
    where user_id = requested_user_id
      and connected_account_id = requested_account_id
      and provider_folder_id = previous_pending_folder_id
      and special_type = 'pending_documents';
  end if;
end;
$$;

revoke execute on function public.change_drive_root(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.change_drive_root(uuid, uuid, text, text) to service_role;

alter table public.organization_preferences enable row level security;
alter table public.onboarding_sessions enable row level security;
alter table public.folder_structure_drafts enable row level security;
alter table public.drive_operations enable row level security;
alter table public.document_actions enable row level security;

revoke all on table public.organization_preferences from public, anon, authenticated;
revoke all on table public.onboarding_sessions from public, anon, authenticated;
revoke all on table public.folder_structure_drafts from public, anon, authenticated;
revoke all on table public.drive_operations from public, anon, authenticated;
revoke all on table public.document_actions from public, anon, authenticated;
grant all on table public.organization_preferences to service_role;
grant all on table public.onboarding_sessions to service_role;
grant all on table public.folder_structure_drafts to service_role;
grant all on table public.drive_operations to service_role;
grant all on table public.document_actions to service_role;

-- Browser roles remain unable to read or mutate provider tokens and Phase 4 state.
-- All access is mediated by authenticated server handlers that derive user_id from Auth.
revoke all on table public.connected_accounts from authenticated;
revoke all on table public.destination_folders from authenticated;

commit;
