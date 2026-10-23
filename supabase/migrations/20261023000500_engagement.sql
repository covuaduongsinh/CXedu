-- CXedu · 0005 · Khách tiềm năng, mẫu tin, hàng đợi thông báo, nhật ký, GV check-in,
-- cổng phụ huynh, gói thuê bao SaaS, realtime, cron nhắc hằng ngày.

create type public.lead_status as enum ('new', 'caring', 'registered', 'lost');
create type public.pay_mode as enum ('per_session', 'per_student', 'flex');
create type public.notify_channel as enum ('zalo_zns', 'push', 'email');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'expired');

-- ---------------------------------------------------------------------------
-- CRM khách tiềm năng + mẫu tin nhắn
-- ---------------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  center_id uuid references public.centers (id) on delete set null,
  parent_name text not null,
  parent_phone text,
  student_name text,
  student_birthday date,
  entry_level public.chess_level,
  status public.lead_status not null default 'new',
  source text,
  notes text,
  student_id uuid references public.students (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  -- low_remaining | consecutive_absence | birthday | invoice | lead_followup
  kind text not null,
  title text not null,
  body text not null,
  zns_template_id text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Hàng đợi thông báo: cron/trigger ghi vào, Edge Function notify-dispatch gửi đi.
-- ---------------------------------------------------------------------------

create table public.notifications_outbox (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid references public.students (id) on delete cascade,
  kind text not null,
  channel public.notify_channel not null,
  recipient text,
  payload jsonb not null default '{}'::jsonb,
  -- Khóa chống trùng, ví dụ low_remaining:<student>:<ngày>.
  dedupe_key text not null unique,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index notifications_outbox_pending_idx on public.notifications_outbox (status, created_at) where status = 'pending';

create table public.push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web', 'desktop')),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

-- ---------------------------------------------------------------------------
-- Nhật ký hoạt động
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid,
  table_name text not null,
  row_id uuid,
  action text not null,
  changes jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_org_created_idx on public.audit_logs (org_id, created_at desc);

create or replace function public.tg_audit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_changes jsonb;
begin
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(key, jsonb_build_object('old', v_old -> key, 'new', value))
      into v_changes
      from jsonb_each(v_new)
      where v_old -> key is distinct from value;
    if v_changes is null then
      return null;
    end if;
  else
    v_changes := coalesce(v_new, v_old);
  end if;
  insert into public.audit_logs (org_id, actor_id, table_name, row_id, action, changes)
    values (
      coalesce((v_new ->> 'org_id')::uuid, (v_old ->> 'org_id')::uuid),
      (select auth.uid()),
      tg_table_name,
      coalesce((v_new ->> 'id')::uuid, (v_old ->> 'id')::uuid),
      lower(tg_op),
      v_changes
    );
  return null;
end;
$$;

create trigger audit_students after insert or update or delete on public.students
  for each row execute function public.tg_audit();
create trigger audit_enrollments after insert or delete on public.enrollments
  for each row execute function public.tg_audit();
create trigger audit_courses after insert or update or delete on public.courses
  for each row execute function public.tg_audit();
create trigger audit_invoices after insert or delete on public.invoices
  for each row execute function public.tg_audit();
create trigger audit_payments after insert or update or delete on public.payments
  for each row execute function public.tg_audit();

-- ---------------------------------------------------------------------------
-- Giáo viên: đơn giá & check-in ca dạy bằng QR xoay vòng
-- ---------------------------------------------------------------------------

create table public.teacher_pay_rates (
  org_id uuid not null references public.organizations (id) on delete cascade,
  teacher_id uuid not null references auth.users (id) on delete cascade,
  mode public.pay_mode not null default 'per_session',
  session_rate bigint not null default 0,
  student_rate bigint not null default 0,
  threshold int not null default 0,
  primary key (org_id, teacher_id)
);

create table public.teacher_checkins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  center_id uuid not null references public.centers (id) on delete cascade,
  teacher_id uuid not null references auth.users (id) on delete cascade,
  class_slot_id uuid references public.class_slots (id) on delete set null,
  session_date date not null default current_date,
  checked_in_at timestamptz not null default now(),
  late_minutes int not null default 0,
  verified_by text not null default 'qr' check (verified_by in ('qr', 'admin')),
  unique (teacher_id, class_slot_id, session_date)
);

-- Mã giống `packages/core/src/rotatingCode.ts`: 16 ký tự đầu HMAC-SHA256(secret, "<center>:<counter>").
create or replace function public.rotating_code(p_secret text, p_center uuid, p_counter bigint)
returns text
language sql immutable set search_path = ''
as $$
  select left(encode(extensions.hmac(p_center::text || ':' || p_counter::text, p_secret, 'sha256'), 'hex'), 16);
$$;

create or replace function public.teacher_checkin(
  p_center_id uuid,
  p_code text,
  p_class_slot_id uuid default null
)
returns public.teacher_checkins
language plpgsql security definer set search_path = ''
as $$
declare
  v_secret text;
  v_org uuid;
  v_counter bigint := floor(extract(epoch from now()) / 45);
  v_row public.teacher_checkins;
  v_start time;
  v_tz text;
begin
  select cs.checkin_secret, cs.org_id into v_secret, v_org from public.center_secrets cs where cs.center_id = p_center_id;
  if v_org is null or not public.can_access_center(v_org, p_center_id) then
    raise exception 'Không có quyền check-in cơ sở này' using errcode = '42501';
  end if;
  if p_code is distinct from public.rotating_code(v_secret, p_center_id, v_counter)
     and p_code is distinct from public.rotating_code(v_secret, p_center_id, v_counter - 1) then
    raise exception 'Mã QR đã hết hạn, hãy quét lại tại lễ tân' using errcode = '22023';
  end if;
  select timezone into v_tz from public.organizations where id = v_org;
  select start_time into v_start from public.class_slots where id = p_class_slot_id;
  insert into public.teacher_checkins (org_id, center_id, teacher_id, class_slot_id, session_date, late_minutes)
    values (
      v_org, p_center_id, (select auth.uid()), p_class_slot_id,
      (now() at time zone v_tz)::date,
      case when v_start is null then 0
        else greatest(0, extract(epoch from ((now() at time zone v_tz)::time - v_start)) / 60)::int end
    )
    on conflict (teacher_id, class_slot_id, session_date) do update set checked_in_at = public.teacher_checkins.checked_in_at
    returning * into v_row;
  return v_row;
end;
$$;

revoke execute on function public.teacher_checkin(uuid, text, uuid) from anon;

-- Kiosk lễ tân lấy mã hiện tại (chỉ owner/admin).
create or replace function public.current_checkin_code(p_center_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_secret text;
  v_org uuid;
  v_counter bigint := floor(extract(epoch from now()) / 45);
begin
  select checkin_secret, org_id into v_secret, v_org from public.center_secrets where center_id = p_center_id;
  if v_org is null or not public.is_org_admin(v_org) then
    raise exception 'Chỉ owner/admin mở được màn hình check-in' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'code', public.rotating_code(v_secret, p_center_id, v_counter),
    'expires_at', to_timestamp((v_counter + 1) * 45)
  );
end;
$$;

revoke execute on function public.current_checkin_code(uuid) from anon;

-- ---------------------------------------------------------------------------
-- Gói thuê bao SaaS
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  plan text not null default 'trial',
  status public.subscription_status not null default 'trialing',
  student_limit int not null default 300,
  trial_ends_at timestamptz not null default now() + interval '30 days',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.tg_org_subscription()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.subscriptions (org_id) values (new.id) on conflict do nothing;
  insert into public.message_templates (org_id, kind, title, body) values
    (new.id, 'low_remaining', 'Nhắc gia hạn',
     'Chào anh/chị {{parent_name}}, con {{student_name}} còn {{remaining}} buổi tại {{center_name}}. Trung tâm gửi anh/chị thông tin gia hạn để con không bị gián đoạn lộ trình nhé.'),
    (new.id, 'consecutive_absence', 'Hỏi thăm khi vắng',
     'Chào anh/chị {{parent_name}}, con {{student_name}} đã vắng 2 buổi gần đây. Trung tâm hỏi thăm sức khỏe của con và sẵn sàng xếp lịch học bù ạ.'),
    (new.id, 'birthday', 'Chúc mừng sinh nhật',
     'Chúc mừng sinh nhật {{student_name}}! Chúc con luôn vui khỏe và ngày càng giỏi cờ. Vui trí tuệ!'),
    (new.id, 'invoice', 'Gửi hóa đơn',
     'Trung tâm gửi anh/chị hóa đơn {{invoice_number}} số tiền {{amount}}. Anh/chị quét mã VietQR trên hóa đơn để thanh toán nhanh ạ.');
  return new;
end;
$$;

create trigger organizations_bootstrap after insert on public.organizations
  for each row execute function public.tg_org_subscription();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.leads enable row level security;
alter table public.message_templates enable row level security;
alter table public.notifications_outbox enable row level security;
alter table public.push_tokens enable row level security;
alter table public.audit_logs enable row level security;
alter table public.teacher_pay_rates enable row level security;
alter table public.teacher_checkins enable row level security;
alter table public.subscriptions enable row level security;

create policy "lead: owner/admin" on public.leads
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy "template: thành viên xem" on public.message_templates
  for select to authenticated using (public.is_org_member(org_id));
create policy "template: owner/admin quản lý" on public.message_templates
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy "outbox: owner/admin xem" on public.notifications_outbox
  for select to authenticated using (public.is_org_admin(org_id));
create policy "push_token: chủ sở hữu" on public.push_tokens
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "audit: owner xem" on public.audit_logs
  for select to authenticated using (public.has_org_role(org_id, array['owner']::public.member_role[]));
create policy "pay_rate: owner/admin" on public.teacher_pay_rates
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy "pay_rate: GV xem của mình" on public.teacher_pay_rates
  for select to authenticated using (teacher_id = (select auth.uid()));
create policy "checkin: owner/admin xem" on public.teacher_checkins
  for select to authenticated using (public.is_org_admin(org_id) or teacher_id = (select auth.uid()));
create policy "subscription: thành viên xem" on public.subscriptions
  for select to authenticated using (public.is_org_member(org_id));

-- ---------------------------------------------------------------------------
-- Cổng phụ huynh: link token + xác minh 4 số cuối SĐT (không cần tài khoản).
-- ---------------------------------------------------------------------------

create or replace function public.get_parent_portal(p_token text, p_phone_suffix text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_student public.students;
begin
  select * into v_student from public.students
    where parent_token = p_token and parent_access_enabled;
  if v_student.id is null
     or p_phone_suffix !~ '^\d{4}$'
     or right(regexp_replace(coalesce(v_student.parent_phone, ''), '\D', '', 'g'), 4) <> p_phone_suffix then
    return null;
  end if;
  return jsonb_build_object(
    'student', jsonb_build_object(
      'full_name', v_student.full_name,
      'chess_level', v_student.chess_level,
      'rating', v_student.rating,
      'enrolled_on', v_student.enrolled_on,
      'parent_name', v_student.parent_name,
      'photo_url', v_student.photo_url
    ),
    'center', (
      select jsonb_build_object('name', c.name, 'phone', c.phone, 'address', c.address,
        'bank_bin', c.bank_bin, 'bank_account', c.bank_account, 'bank_holder', c.bank_holder,
        'org_name', o.name)
      from public.centers c join public.organizations o on o.id = c.org_id
      where c.id = v_student.center_id
    ),
    'enrollments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'course', co.name, 'chess_level', co.chess_level, 'total_lessons', e.total_lessons,
        'used_lessons', e.used_lessons, 'status', e.status, 'start_date', e.start_date,
        'expected_end_date', e.expected_end_date) order by e.start_date desc)
      from public.enrollments e join public.courses co on co.id = e.course_id
      where e.student_id = v_student.id
    ), '[]'::jsonb),
    'attendance', coalesce((
      select jsonb_agg(jsonb_build_object('date', a.session_date, 'status', a.status, 'kind', a.kind, 'note', a.note)
        order by a.session_date desc)
      from (select * from public.attendance where student_id = v_student.id
            order by session_date desc limit 60) a
    ), '[]'::jsonb),
    'levels', coalesce((
      select jsonb_agg(jsonb_build_object('from', l.from_level, 'to', l.to_level, 'date', l.changed_on)
        order by l.changed_on)
      from public.level_history l where l.student_id = v_student.id
    ), '[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object('body', r.body, 'date', r.created_at) order by r.created_at desc)
      from public.student_reviews r where r.student_id = v_student.id and r.visible_to_parent
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object('number', i.number, 'issue_date', i.issue_date, 'due_date', i.due_date,
        'total', i.total, 'paid', i.paid_amount, 'status', i.status, 'transfer_ref', i.transfer_ref)
        order by i.issue_date desc)
      from public.invoices i where i.student_id = v_student.id and i.status <> 'void'
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_parent_portal(text, text) to anon, authenticated;

create or replace function public.touch_parent_portal(p_token text)
returns void
language sql security definer set search_path = ''
as $$
  update public.students set parent_last_viewed_at = now() where parent_token = p_token;
$$;

grant execute on function public.touch_parent_portal(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Nhắc hằng ngày → outbox (chạy bằng pg_cron lúc 07:00 giờ VN = 00:00 UTC).
-- ---------------------------------------------------------------------------

create or replace function public.enqueue_daily_notifications(p_today date default (now() at time zone 'Asia/Ho_Chi_Minh')::date)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_count int := 0;
  v_rows int;
begin
  insert into public.notifications_outbox (org_id, student_id, kind, channel, recipient, payload, dedupe_key)
  select s.org_id, s.id, 'low_remaining', 'zalo_zns', s.parent_phone,
    jsonb_build_object('student_name', s.full_name, 'parent_name', s.parent_name,
      'remaining', r.remaining_lessons, 'center_name', c.name),
    'low_remaining:' || s.id || ':' || r.remaining_lessons
  from (
    select e.student_id, sum(greatest(e.total_lessons - e.used_lessons, 0))::int as remaining_lessons
    from public.enrollments e
    where e.status = 'active' and e.price > 0
    group by e.student_id
  ) r
  join public.students s on s.id = r.student_id and s.status = 'active'
  join public.organizations o on o.id = s.org_id
  join public.centers c on c.id = s.center_id
  where r.remaining_lessons <= o.low_remaining_threshold and s.parent_phone is not null
  on conflict (dedupe_key) do nothing;
  get diagnostics v_rows = row_count;
  v_count := v_count + v_rows;

  insert into public.notifications_outbox (org_id, student_id, kind, channel, recipient, payload, dedupe_key)
  select s.org_id, s.id, 'birthday', 'zalo_zns', s.parent_phone,
    jsonb_build_object('student_name', s.full_name, 'parent_name', s.parent_name),
    'birthday:' || s.id || ':' || extract(year from p_today)
  from public.students s
  where s.status = 'active' and s.parent_phone is not null and s.birthday is not null
    and extract(month from s.birthday) = extract(month from p_today)
    and extract(day from s.birthday) = extract(day from p_today)
  on conflict (dedupe_key) do nothing;
  get diagnostics v_rows = row_count;
  return v_count + v_rows;
end;
$$;

revoke execute on function public.enqueue_daily_notifications(date) from public, anon, authenticated;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('cxedu-daily-notifications', '0 0 * * *', 'select public.enqueue_daily_notifications()');
exception when others then
  raise notice 'pg_cron chưa sẵn sàng: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- Realtime: đồng bộ web / mobile / desktop.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table
  public.attendance, public.enrollments, public.students, public.invoices, public.payments,
  public.renewal_followups, public.teacher_checkins;
