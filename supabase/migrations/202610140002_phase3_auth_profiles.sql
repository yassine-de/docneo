-- Phase 3: authenticated profiles with owner-only reads and constrained updates.
begin;

alter table public.profiles add column email text;
alter table public.profiles add column display_name text;

-- Backfill existing email users without overwriting profile lifecycle fields.
-- A conflict can occur when the Phase 1 trigger already created the profile.
insert into public.profiles (user_id, email, display_name, locale)
select
  auth_user.id,
  auth_user.email,
  case
    when char_length(trim(auth_user.raw_user_meta_data ->> 'display_name')) between 2 and 80 then trim(auth_user.raw_user_meta_data ->> 'display_name')
    when char_length(split_part(auth_user.email, '@', 1)) between 2 and 80 then split_part(auth_user.email, '@', 1)
    else 'Docneo User'
  end,
  case when auth_user.raw_user_meta_data ->> 'locale' = 'fr' then 'fr' else 'de' end
from auth.users as auth_user
where auth_user.email is not null
on conflict (user_id) do update
set email = excluded.email,
    display_name = excluded.display_name;

do $$
begin
  if exists (select 1 from auth.users where email is null) then
    raise exception 'Docneo requires email-based Auth users before applying Phase 3';
  end if;
end;
$$;

alter table public.profiles alter column email set not null;
alter table public.profiles alter column display_name set not null;
alter table public.profiles add constraint profiles_email_length check (char_length(email) between 3 and 254);
alter table public.profiles add constraint profiles_display_name_length check (char_length(display_name) between 2 and 80);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  requested_name text := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  fallback_name text := split_part(new.email, '@', 1);
begin
  insert into public.profiles (user_id, email, display_name, locale)
  values (
    new.id,
    new.email,
    case
      when char_length(requested_name) between 2 and 80 then requested_name
      when char_length(fallback_name) between 2 and 80 then fallback_name
      else 'Docneo User'
    end,
    case when new.raw_user_meta_data ->> 'locale' = 'fr' then 'fr' else 'de' end
  );
  return new;
end;
$$;

create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.sync_profile_email();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_profile_email() from public, anon, authenticated;

create policy profiles_owner_select on public.profiles
for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_owner_update on public.profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke insert, delete on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, locale) on public.profiles to authenticated;

commit;
