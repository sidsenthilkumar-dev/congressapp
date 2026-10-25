begin;
create extension if not exists pgcrypto with schema extensions;

-- Approval is provisioned by the service administrator, never by an app user.
create table public.clinician_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 100),
  approved boolean not null default false
);
create table public.clinic_connections (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id),
  clinician_id uuid not null references public.clinician_profiles(user_id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(patient_id, clinician_id), check(patient_id <> clinician_id)
);
create table public.clinic_invites (
  token_hash text primary key,
  clinician_id uuid not null references public.clinician_profiles(user_id),
  expires_at timestamptz not null,
  used_at timestamptz
);
create function public.approved_clinician(subject uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
 select exists(select 1 from public.clinician_profiles where user_id = subject and approved);
$$;
create function public.valid_clinic_plan(content jsonb) returns boolean language plpgsql immutable set search_path = public, pg_temp as $$
declare item jsonb;
begin
 if jsonb_typeof(content) is distinct from 'object' or jsonb_typeof(content->'title') is distinct from 'string' or length(content->>'title') not between 1 and 100 or jsonb_typeof(content->'notes') is distinct from 'string' or length(content->>'notes') > 2000 or jsonb_typeof(content->'items') is distinct from 'array' then return false; end if;
 if jsonb_array_length(content->'items') not between 1 and 12 then return false; end if;
 for item in select * from jsonb_array_elements(content->'items') loop
  if jsonb_typeof(item->'exerciseId') is distinct from 'string' or length(item->>'exerciseId') not between 1 and 64 or jsonb_typeof(item->'note') is distinct from 'string' or length(item->>'note') > 1000 then return false; end if;
  if item ? 'reps' and (jsonb_typeof(item->'reps') is distinct from 'number' or (item->>'reps')::numeric not between 1 and 200 or mod((item->>'reps')::numeric, 1) <> 0) then return false; end if;
 end loop;
 return true;
exception when others then return false;
end; $$;
create table public.clinic_plans (
 id uuid primary key default gen_random_uuid(),
 connection_id uuid not null references public.clinic_connections(id),
 author_id uuid not null references public.clinician_profiles(user_id),
 content jsonb not null check(public.valid_clinic_plan(content)),
 created_at timestamptz not null default now()
);
create table public.clinic_clips (
 id uuid primary key,
 connection_id uuid not null references public.clinic_connections(id),
 patient_id uuid not null references auth.users(id),
 exercise_id text not null check(length(exercise_id) between 1 and 64),
 storage_path text not null unique,
 consent_at timestamptz not null,
 uploaded_at timestamptz,
 created_at timestamptz not null default now(),
 check(storage_path like connection_id::text || '/' || patient_id::text || '/' || id::text || '.%')
);
create index on public.clinic_connections(patient_id);
create index on public.clinic_connections(clinician_id);
create index on public.clinic_plans(connection_id);
create index on public.clinic_clips(connection_id);

alter table public.clinician_profiles enable row level security;
alter table public.clinic_connections enable row level security;
alter table public.clinic_invites enable row level security;
alter table public.clinic_plans enable row level security;
alter table public.clinic_clips enable row level security;
revoke all on public.clinician_profiles, public.clinic_connections, public.clinic_invites, public.clinic_plans, public.clinic_clips from anon, authenticated;
grant select on public.clinician_profiles, public.clinic_connections, public.clinic_plans, public.clinic_clips to authenticated;
grant insert on public.clinic_plans, public.clinic_clips to authenticated;
grant update(uploaded_at) on public.clinic_clips to authenticated;
grant delete on public.clinic_clips to authenticated;
create policy clinician_self on public.clinician_profiles for select to authenticated using(user_id = auth.uid());
create policy care_participants on public.clinic_connections for select to authenticated using(patient_id = auth.uid() or clinician_id = auth.uid());
create policy plan_read on public.clinic_plans for select to authenticated using(exists(select 1 from public.clinic_connections c where c.id = connection_id and (c.patient_id = auth.uid() or (c.active and c.clinician_id = auth.uid() and public.approved_clinician(auth.uid())))));
create policy plan_write on public.clinic_plans for insert to authenticated with check(author_id = auth.uid() and public.approved_clinician(auth.uid()) and exists(select 1 from public.clinic_connections c where c.id = connection_id and c.active and c.clinician_id = auth.uid()));
create policy clip_read on public.clinic_clips for select to authenticated using(patient_id = auth.uid() or exists(select 1 from public.clinic_connections c where c.id = connection_id and c.active and c.clinician_id = auth.uid() and public.approved_clinician(auth.uid())));
create policy clip_write on public.clinic_clips for insert to authenticated with check(patient_id = auth.uid() and exists(select 1 from public.clinic_connections c where c.id = connection_id and c.active and c.patient_id = auth.uid()));
create policy clip_finalize on public.clinic_clips for update to authenticated using(patient_id = auth.uid()) with check(patient_id = auth.uid());
create policy clip_delete on public.clinic_clips for delete to authenticated using(patient_id = auth.uid());

create function public.create_clinic_invite() returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare token text;
begin
 if auth.uid() is null or not public.approved_clinician(auth.uid()) then raise exception 'An approved clinician account is required.'; end if;
 if (select count(*) from public.clinic_invites where clinician_id = auth.uid() and expires_at > now() and used_at is null) >= 20 then raise exception 'Too many unused invitations.'; end if;
 token := encode(extensions.gen_random_bytes(24), 'hex');
 insert into public.clinic_invites(token_hash, clinician_id, expires_at) values(encode(extensions.digest(token, 'sha256'), 'hex'), auth.uid(), now() + interval '24 hours');
 return token;
end; $$;
create function public.accept_clinic_invite(invite_token text) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare invitation public.clinic_invites; connection uuid;
begin
 if auth.uid() is null or length(invite_token) <> 48 then raise exception 'Invalid invitation or sign-in required.'; end if;
 select * into invitation from public.clinic_invites where token_hash = encode(extensions.digest(invite_token, 'sha256'), 'hex') and used_at is null and expires_at > now() for update;
 if not found or invitation.clinician_id = auth.uid() or not public.approved_clinician(invitation.clinician_id) then raise exception 'Invitation is invalid, expired, or already used.'; end if;
 insert into public.clinic_connections(patient_id, clinician_id) values(auth.uid(), invitation.clinician_id) on conflict(patient_id,clinician_id) do update set active = true returning id into connection;
 update public.clinic_invites set used_at = now() where token_hash = invitation.token_hash;
 return connection;
end; $$;
create function public.disconnect_clinic(connection uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
 update public.clinic_connections set active = false where id = connection and (patient_id = auth.uid() or clinician_id = auth.uid());
 if not found then raise exception 'Connection not found.'; end if;
end; $$;
revoke all on function public.create_clinic_invite(), public.accept_clinic_invite(text), public.disconnect_clinic(uuid), public.approved_clinician(uuid) from public, anon;
grant execute on function public.create_clinic_invite(), public.accept_clinic_invite(text), public.disconnect_clinic(uuid), public.approved_clinician(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('clinic-clips','clinic-clips',false,20971520,array['video/mp4','video/webm','video/quicktime']) on conflict(id) do update set public=false, file_size_limit=20971520, allowed_mime_types=array['video/mp4','video/webm','video/quicktime'];
create policy private_clip_upload on storage.objects for insert to authenticated with check(bucket_id='clinic-clips' and exists(select 1 from public.clinic_clips v join public.clinic_connections c on c.id=v.connection_id where v.storage_path=name and v.patient_id=auth.uid() and c.active and c.patient_id=auth.uid()));
create policy private_clip_read on storage.objects for select to authenticated using(bucket_id='clinic-clips' and exists(select 1 from public.clinic_clips v join public.clinic_connections c on c.id=v.connection_id where v.storage_path=name and (v.patient_id=auth.uid() or (c.active and c.clinician_id=auth.uid() and public.approved_clinician(auth.uid()) and v.uploaded_at is not null))));
create policy private_clip_delete on storage.objects for delete to authenticated using(bucket_id='clinic-clips' and exists(select 1 from public.clinic_clips v where v.storage_path=name and v.patient_id=auth.uid()));

create table public.assistant_requests(user_id uuid not null references auth.users(id) on delete cascade, requested_at timestamptz not null default now());
create index on public.assistant_requests(user_id,requested_at);
alter table public.assistant_requests enable row level security;
revoke all on public.assistant_requests from anon, authenticated;
create function public.take_assistant_budget() returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if (select count(*) from public.assistant_requests where user_id=auth.uid() and requested_at > now()-interval '24 hours') >= 20 or (select count(*) from public.assistant_requests where user_id=auth.uid() and requested_at > now()-interval '1 minute') >= 3 then return false; end if;
 insert into public.assistant_requests(user_id) values(auth.uid());
 delete from public.assistant_requests where requested_at < now()-interval '2 days';
 return true;
end; $$;
revoke all on function public.take_assistant_budget() from public,anon;
grant execute on function public.take_assistant_budget() to authenticated;
commit;
