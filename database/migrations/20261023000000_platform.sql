-- CX Platform · 0000 · Nền tảng tự host thay Supabase:
-- vai trò theo mô hình PostgREST, schema extensions/auth, bảng đăng nhập (Better Auth) và auth.uid().

-- ---------------------------------------------------------------------------
-- Vai trò
--   anon           : người chưa đăng nhập (cổng phụ huynh)
--   authenticated  : người dùng đã đăng nhập (JWT do CX API cấp)
--   service_role   : dịch vụ nội bộ (webhook ngân hàng), bỏ qua RLS
--   authenticator  : tài khoản PostgREST dùng để kết nối rồi SET ROLE theo JWT
-- Mật khẩu của authenticator được đặt khi triển khai (database/scripts/db.mjs), không nằm trong migration.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then
    create role authenticator login noinherit;
  end if;
end;
$$;

grant anon, authenticated, service_role to authenticator;

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

do $$
begin
  execute format('alter database %I set search_path = "$user", public, extensions', current_database());
end;
$$;

grant usage on schema public to anon, authenticated, service_role;
-- Bảng mới trong public mặc định cấp quyền cho các vai trò API; RLS quyết định từng dòng.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Đăng nhập (Better Auth). Không cấp quyền cho vai trò API: chỉ CX API đọc/ghi.
-- Cột camelCase theo lược đồ chuẩn của Better Auth 1.7; id dùng UUID.
-- ---------------------------------------------------------------------------

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  "id" uuid primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null default false,
  "image" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table auth.sessions (
  "id" uuid primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" uuid not null references auth.users ("id") on delete cascade
);
create index sessions_user_idx on auth.sessions ("userId");

create table auth.accounts (
  "id" uuid primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" uuid not null references auth.users ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index accounts_user_idx on auth.accounts ("userId");

create table auth.verifications (
  "id" uuid primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index verifications_identifier_idx on auth.verifications ("identifier");

-- ---------------------------------------------------------------------------
-- Ngữ cảnh người gọi: PostgREST đặt `request.jwt.claims` từ JWT (sub, role, email).
-- ---------------------------------------------------------------------------

create or replace function auth.jwt()
returns jsonb
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

create or replace function auth.uid()
returns uuid
language sql stable
as $$
  select nullif(
    coalesce(current_setting('request.jwt.claim.sub', true), auth.jwt() ->> 'sub'),
    ''
  )::uuid;
$$;

create or replace function auth.role()
returns text
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), auth.jwt() ->> 'role');
$$;

grant execute on function auth.jwt(), auth.uid(), auth.role() to anon, authenticated, service_role;
