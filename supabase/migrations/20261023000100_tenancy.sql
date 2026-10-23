-- CXedu · 0001 · Đa tenant: tổ chức (thương hiệu) → cơ sở, thành viên & vai trò.

create extension if not exists pgcrypto with schema extensions;

create type public.member_role as enum ('owner', 'admin', 'teacher');
create type public.chess_level as enum ('pawn', 'knight', 'bishop', 'rook', 'queen', 'king');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  logo_url text,
  phone text,
  address text,
  business_type text not null default 'chess',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  -- Ngưỡng "sắp hết buổi" (tổng buổi còn lại <= ngưỡng).
  low_remaining_threshold int not null default 4 check (low_remaining_threshold between 0 and 50),
  invoice_prefix text not null default 'HD' check (invoice_prefix ~ '^[A-Z0-9]{1,8}$'),
  company_name text,
  tax_code text,
  tax_address text,
  invoice_email text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  display_name text,
  -- null = được truy cập mọi cơ sở của tổ chức.
  center_ids uuid[],
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create table public.centers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  address text,
  phone text,
  bank_bin text check (bank_bin is null or bank_bin ~ '^\d{6}$'),
  bank_account text,
  bank_holder text,
  course_rules text,
  created_at timestamptz not null default now()
);
create index centers_org_idx on public.centers (org_id);

-- Bí mật sinh mã QR check-in xoay vòng; chỉ owner/admin đọc được.
create table public.center_secrets (
  center_id uuid primary key references public.centers (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  checkin_secret text not null default encode(extensions.gen_random_bytes(24), 'hex')
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  center_id uuid not null references public.centers (id) on delete cascade,
  name text not null,
  capacity int check (capacity is null or capacity > 0),
  created_at timestamptz not null default now()
);

create table public.center_closures (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  -- null = nghỉ toàn hệ thống.
  center_id uuid references public.centers (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  check (end_date >= start_date)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role public.member_role not null check (role <> 'owner'),
  center_ids uuid[],
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  invited_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Hàm phân quyền dùng trong RLS (security definer để tránh đệ quy policy).
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_org_role(p_org uuid, p_roles public.member_role[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = (select auth.uid()) and m.role = any (p_roles)
  );
$$;

create or replace function public.is_org_admin(p_org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_org_role(p_org, array['owner', 'admin']::public.member_role[]);
$$;

create or replace function public.can_access_center(p_org uuid, p_center uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org
      and m.user_id = (select auth.uid())
      and (m.center_ids is null or p_center is null or p_center = any (m.center_ids))
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.centers enable row level security;
alter table public.center_secrets enable row level security;
alter table public.rooms enable row level security;
alter table public.center_closures enable row level security;
alter table public.invitations enable row level security;

create policy "org: thành viên xem" on public.organizations
  for select to authenticated using (public.is_org_member(id));
create policy "org: owner/admin sửa" on public.organizations
  for update to authenticated using (public.is_org_admin(id)) with check (public.is_org_admin(id));

create policy "membership: xem thành viên cùng tổ chức" on public.memberships
  for select to authenticated using (public.is_org_member(org_id));
create policy "membership: owner quản lý" on public.memberships
  for all to authenticated
  using (public.has_org_role(org_id, array['owner']::public.member_role[]))
  with check (public.has_org_role(org_id, array['owner']::public.member_role[]));

create policy "center: thành viên xem cơ sở được phân công" on public.centers
  for select to authenticated using (public.can_access_center(org_id, id));
create policy "center: owner/admin quản lý" on public.centers
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "center_secret: owner/admin" on public.center_secrets
  for select to authenticated using (public.is_org_admin(org_id));

create policy "room: thành viên xem" on public.rooms
  for select to authenticated using (public.can_access_center(org_id, center_id));
create policy "room: owner/admin quản lý" on public.rooms
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "closure: thành viên xem" on public.center_closures
  for select to authenticated using (public.is_org_member(org_id));
create policy "closure: owner/admin quản lý" on public.center_closures
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "invitation: owner/admin quản lý" on public.invitations
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

-- Mỗi cơ sở mới tự có bí mật check-in.
create or replace function public.tg_center_secret()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.center_secrets (center_id, org_id) values (new.id, new.org_id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger centers_secret after insert on public.centers
  for each row execute function public.tg_center_secret();

-- ---------------------------------------------------------------------------
-- RPC: tạo tổ chức mới (người gọi thành owner) + cơ sở đầu tiên.
-- ---------------------------------------------------------------------------

create or replace function public.create_organization(p_name text, p_center_name text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_org uuid;
begin
  if v_user is null then
    raise exception 'Cần đăng nhập' using errcode = '42501';
  end if;
  insert into public.organizations (name, created_by) values (trim(p_name), v_user)
    returning id into v_org;
  insert into public.memberships (org_id, user_id, role) values (v_org, v_user, 'owner');
  insert into public.centers (org_id, name)
    values (v_org, coalesce(nullif(trim(p_center_name), ''), 'Cơ sở chính'));
  return v_org;
end;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_invite public.invitations;
begin
  select * into v_invite from public.invitations
    where token = p_token and accepted_at is null and expires_at > now()
    for update;
  if v_invite.id is null then
    raise exception 'Lời mời không hợp lệ hoặc đã hết hạn' using errcode = 'P0002';
  end if;
  insert into public.memberships (org_id, user_id, role, center_ids)
    values (v_invite.org_id, v_user, v_invite.role, v_invite.center_ids)
    on conflict (org_id, user_id) do update set role = excluded.role, center_ids = excluded.center_ids;
  update public.invitations set accepted_at = now() where id = v_invite.id;
  return v_invite.org_id;
end;
$$;

revoke execute on function public.create_organization(text, text) from anon;
revoke execute on function public.accept_invitation(text) from anon;
