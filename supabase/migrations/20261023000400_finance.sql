-- CXedu · 0004 · Hóa đơn, thanh toán, công nợ, chi phí. Đối soát VietQR qua mã nội dung CK.

create type public.invoice_status as enum ('unpaid', 'partial', 'paid', 'void');
create type public.payment_method as enum ('transfer', 'cash', 'card', 'other');

create table public.invoice_counters (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  last_number int not null default 0
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  center_id uuid not null references public.centers (id) on delete restrict,
  student_id uuid references public.students (id) on delete set null,
  number text not null,
  issue_date date not null default current_date,
  due_date date,
  subtotal bigint not null default 0 check (subtotal >= 0),
  discount bigint not null default 0 check (discount >= 0),
  total bigint not null default 0 check (total >= 0),
  paid_amount bigint not null default 0 check (paid_amount >= 0),
  status public.invoice_status not null default 'unpaid',
  -- Nội dung CK in trên VietQR, dùng để webhook ngân hàng tự khớp.
  transfer_ref text not null unique,
  note text,
  internal_note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, number)
);
create index invoices_org_status_idx on public.invoices (org_id, status);
create index invoices_student_idx on public.invoices (student_id);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  amount bigint generated always as (round(quantity * unit_price)::bigint) stored,
  course_id uuid references public.courses (id) on delete set null,
  enrollment_id uuid references public.enrollments (id) on delete set null,
  position int not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  invoice_id uuid references public.invoices (id) on delete set null,
  student_id uuid references public.students (id) on delete set null,
  amount bigint not null check (amount > 0),
  method public.payment_method not null default 'transfer',
  paid_at timestamptz not null default now(),
  reference text,
  source text not null default 'manual' check (source in ('manual', 'bank_webhook')),
  -- Mã giao dịch ngân hàng để webhook không ghi trùng.
  external_id text unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index payments_org_paid_idx on public.payments (org_id, paid_at desc);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  center_id uuid references public.centers (id) on delete set null,
  category text not null default 'Khác',
  amount bigint not null check (amount > 0),
  spent_on date not null default current_date,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.invoice_counters enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;

-- Tài chính chỉ dành cho owner/admin.
create policy "invoice: owner/admin" on public.invoices
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy "invoice_line: owner/admin" on public.invoice_lines
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy "payment: owner/admin" on public.payments
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy "expense: owner/admin" on public.expenses
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

-- Tổng tiền hóa đơn = tổng dòng − giảm giá; trạng thái theo số đã thu.
create or replace function public.refresh_invoice(p_invoice uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_subtotal bigint;
  v_paid bigint;
  v_invoice public.invoices;
begin
  select coalesce(sum(amount), 0) into v_subtotal from public.invoice_lines where invoice_id = p_invoice;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = p_invoice;
  update public.invoices set
    subtotal = v_subtotal,
    discount = least(discount, v_subtotal),
    total = v_subtotal - least(discount, v_subtotal),
    paid_amount = v_paid,
    status = case
      when status = 'void' then 'void'::public.invoice_status
      when v_paid >= v_subtotal - least(discount, v_subtotal) and v_subtotal > 0 then 'paid'::public.invoice_status
      when v_paid > 0 then 'partial'::public.invoice_status
      else 'unpaid'::public.invoice_status
    end
  where id = p_invoice
  returning * into v_invoice;

  -- Hóa đơn của học viên đã thu đủ → đánh dấu tái đăng ký đã đóng.
  if v_invoice.status = 'paid' and v_invoice.student_id is not null then
    update public.renewal_followups set paid = true, invoice_id = v_invoice.id, updated_at = now()
      where student_id = v_invoice.student_id;
  end if;
end;
$$;

revoke execute on function public.refresh_invoice(uuid) from public, anon, authenticated;

create or replace function public.tg_invoice_children()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.invoice_id is not null then
    perform public.refresh_invoice(old.invoice_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.invoice_id is not null then
    perform public.refresh_invoice(new.invoice_id);
  end if;
  return null;
end;
$$;

create trigger invoice_lines_refresh after insert or update or delete on public.invoice_lines
  for each row execute function public.tg_invoice_children();
create trigger payments_refresh after insert or update or delete on public.payments
  for each row execute function public.tg_invoice_children();

create or replace function public.tg_invoice_discount()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.discount is distinct from old.discount or new.status is distinct from old.status then
    perform public.refresh_invoice(new.id);
  end if;
  return null;
end;
$$;

create trigger invoices_discount_refresh after update of discount, status on public.invoices
  for each row when (pg_trigger_depth() < 2) execute function public.tg_invoice_discount();

-- Số hóa đơn tăng dần theo tổ chức: HD000123. Mã CK = tiền tố + số.
create or replace function public.tg_invoice_number()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_next int;
  v_prefix text;
begin
  if new.number is null or new.number = '' then
    insert into public.invoice_counters (org_id, last_number) values (new.org_id, 1)
      on conflict (org_id) do update set last_number = public.invoice_counters.last_number + 1
      returning last_number into v_next;
    select invoice_prefix into v_prefix from public.organizations where id = new.org_id;
    new.number := v_prefix || lpad(v_next::text, 6, '0');
  end if;
  if new.transfer_ref is null or new.transfer_ref = '' then
    new.transfer_ref := upper(regexp_replace('CX' || left(replace(new.org_id::text, '-', ''), 6) || new.number, '[^A-Za-z0-9]', '', 'g'));
  end if;
  return new;
end;
$$;

create trigger invoices_number before insert on public.invoices
  for each row execute function public.tg_invoice_number();

-- Tạo hóa đơn kèm dòng trong 1 giao dịch. p_lines: [{description, quantity, unit_price, enrollment_id?, course_id?}]
create or replace function public.create_invoice(
  p_center_id uuid,
  p_lines jsonb,
  p_student_id uuid default null,
  p_discount bigint default 0,
  p_due_date date default null,
  p_note text default null
)
returns public.invoices
language plpgsql security definer set search_path = ''
as $$
declare
  v_org uuid;
  v_invoice public.invoices;
  v_line jsonb;
  v_pos int := 0;
begin
  select org_id into v_org from public.centers where id = p_center_id;
  if v_org is null or not public.is_org_admin(v_org) then
    raise exception 'Không có quyền tạo hóa đơn' using errcode = '42501';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Hóa đơn cần ít nhất 1 dòng' using errcode = '22023';
  end if;
  insert into public.invoices (org_id, center_id, student_id, number, transfer_ref, discount, due_date, note, created_by)
    values (v_org, p_center_id, p_student_id, '', '', greatest(coalesce(p_discount, 0), 0), p_due_date, p_note, (select auth.uid()))
    returning * into v_invoice;
  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into public.invoice_lines (invoice_id, org_id, description, quantity, unit_price, enrollment_id, course_id, position)
      values (
        v_invoice.id, v_org, v_line ->> 'description',
        coalesce((v_line ->> 'quantity')::numeric, 1),
        (v_line ->> 'unit_price')::bigint,
        nullif(v_line ->> 'enrollment_id', '')::uuid,
        nullif(v_line ->> 'course_id', '')::uuid,
        v_pos
      );
    v_pos := v_pos + 1;
  end loop;
  if p_student_id is not null then
    insert into public.renewal_followups (student_id, org_id, following_up, invoice_sent, invoice_id, updated_by)
      values (p_student_id, v_org, true, true, v_invoice.id, (select auth.uid()))
      on conflict (student_id) do update set invoice_sent = true, following_up = true,
        invoice_id = excluded.invoice_id, updated_by = excluded.updated_by, updated_at = now();
  end if;
  perform public.refresh_invoice(v_invoice.id);
  select * into v_invoice from public.invoices where id = v_invoice.id;
  return v_invoice;
end;
$$;

revoke execute on function public.create_invoice(uuid, jsonb, uuid, bigint, date, text) from anon;

-- Webhook ngân hàng (SePay/Casso) gọi qua Edge Function bằng service role.
create or replace function public.record_bank_transfer(
  p_external_id text,
  p_amount bigint,
  p_content text,
  p_paid_at timestamptz default now()
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_invoice public.invoices;
  v_payment uuid;
  v_content text := upper(regexp_replace(coalesce(p_content, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  select * into v_invoice from public.invoices
    where status in ('unpaid', 'partial') and position(transfer_ref in v_content) > 0
    order by created_at desc limit 1;
  if v_invoice.id is null then
    return null;
  end if;
  insert into public.payments (org_id, invoice_id, student_id, amount, method, paid_at, reference, source, external_id)
    values (v_invoice.org_id, v_invoice.id, v_invoice.student_id, p_amount, 'transfer', p_paid_at, p_content, 'bank_webhook', p_external_id)
    on conflict (external_id) do nothing
    returning id into v_payment;
  return v_invoice.id;
end;
$$;

revoke execute on function public.record_bank_transfer(text, bigint, text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_bank_transfer(text, bigint, text, timestamptz) to service_role;
