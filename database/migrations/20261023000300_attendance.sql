-- CXedu · 0003 · Điểm danh 1 chạm, tự trừ buổi, cảnh báo sắp hết buổi / vắng liên tiếp.
-- Quy tắc trừ buổi giống `packages/core/src/attendance.ts` (sessionCharge/summarizeEnrollment).

create type public.attendance_status as enum ('present', 'excused', 'unexcused');
create type public.session_kind as enum ('regular', 'makeup', 'single');

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  center_id uuid not null references public.centers (id) on delete cascade,
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  class_slot_id uuid references public.class_slots (id) on delete set null,
  session_date date not null,
  status public.attendance_status not null,
  kind public.session_kind not null default 'regular',
  free boolean not null default false,
  -- 0/1: buổi này có trừ vào gói không (do recompute_enrollment_usage tính).
  charged smallint not null default 0 check (charged in (0, 1)),
  note text,
  marked_by uuid references auth.users (id) on delete set null,
  marked_at timestamptz not null default now(),
  unique (enrollment_id, session_date, kind)
);
create index attendance_center_date_idx on public.attendance (center_id, session_date);
create index attendance_student_date_idx on public.attendance (student_id, session_date desc);

create table public.renewal_followups (
  student_id uuid primary key references public.students (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  following_up boolean not null default false,
  invoice_sent boolean not null default false,
  paid boolean not null default false,
  note text,
  invoice_id uuid,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.attendance enable row level security;
alter table public.renewal_followups enable row level security;

create policy "attendance: thành viên xem theo cơ sở" on public.attendance
  for select to authenticated using (public.can_access_center(org_id, center_id));
-- Ghi điểm danh đi qua RPC mark_attendance / unmark_attendance.

create policy "renewal: thành viên xem" on public.renewal_followups
  for select to authenticated using (public.is_org_member(org_id));
create policy "renewal: owner/admin quản lý" on public.renewal_followups
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

-- Tính lại số buổi đã dùng của một ghi danh theo thứ tự thời gian.
create or replace function public.recompute_enrollment_usage(p_enrollment uuid)
returns public.enrollments
language plpgsql security definer set search_path = ''
as $$
declare
  v_enrollment public.enrollments;
  v_max int;
  v_used int := 0;
  v_waived int := 0;
  v_charge smallint;
  r record;
begin
  select * into v_enrollment from public.enrollments where id = p_enrollment for update;
  select c.max_excused_absences into v_max from public.courses c where c.id = v_enrollment.course_id;
  for r in
    select id, status, free from public.attendance
    where enrollment_id = p_enrollment
    order by session_date, marked_at
  loop
    if r.free then
      v_charge := 0;
    elsif r.status <> 'excused' then
      v_charge := 1;
    elsif v_max is null or v_waived < v_max then
      v_charge := 0;
      v_waived := v_waived + 1;
    else
      v_charge := 1;
    end if;
    update public.attendance set charged = v_charge where id = r.id and charged <> v_charge;
    v_used := v_used + v_charge;
  end loop;

  update public.enrollments set
    used_lessons = v_used,
    excused_waived = v_waived,
    status = case
      when status in ('active', 'completed') and v_used >= total_lessons then 'completed'::public.enrollment_status
      when status = 'completed' and v_used < total_lessons then 'active'::public.enrollment_status
      else status
    end
  where id = p_enrollment
  returning * into v_enrollment;
  return v_enrollment;
end;
$$;

revoke execute on function public.recompute_enrollment_usage(uuid) from public, anon, authenticated;

create or replace function public.mark_attendance(
  p_enrollment_id uuid,
  p_session_date date,
  p_status public.attendance_status,
  p_kind public.session_kind default 'regular',
  p_free boolean default false,
  p_class_slot_id uuid default null,
  p_note text default null
)
returns public.attendance
language plpgsql security definer set search_path = ''
as $$
declare
  v_student public.students;
  v_enrollment public.enrollments;
  v_row public.attendance;
begin
  select * into v_enrollment from public.enrollments where id = p_enrollment_id;
  if v_enrollment.id is null then
    raise exception 'Không tìm thấy ghi danh' using errcode = 'P0002';
  end if;
  select * into v_student from public.students where id = v_enrollment.student_id;
  if not public.can_access_center(v_student.org_id, v_student.center_id) then
    raise exception 'Không có quyền điểm danh cơ sở này' using errcode = '42501';
  end if;

  insert into public.attendance as a (
    org_id, center_id, enrollment_id, student_id, class_slot_id,
    session_date, status, kind, free, note, marked_by
  ) values (
    v_student.org_id, v_student.center_id, v_enrollment.id, v_student.id, p_class_slot_id,
    p_session_date, p_status, p_kind, p_free, p_note, (select auth.uid())
  )
  on conflict (enrollment_id, session_date, kind) do update set
    status = excluded.status,
    free = excluded.free,
    note = coalesce(excluded.note, a.note),
    class_slot_id = coalesce(excluded.class_slot_id, a.class_slot_id),
    marked_by = excluded.marked_by,
    marked_at = now()
  returning * into v_row;

  perform public.recompute_enrollment_usage(v_enrollment.id);
  select * into v_row from public.attendance where id = v_row.id;
  return v_row;
end;
$$;

create or replace function public.unmark_attendance(p_attendance_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_row public.attendance;
begin
  select * into v_row from public.attendance where id = p_attendance_id;
  if v_row.id is null then
    return;
  end if;
  if not public.can_access_center(v_row.org_id, v_row.center_id) then
    raise exception 'Không có quyền sửa điểm danh cơ sở này' using errcode = '42501';
  end if;
  delete from public.attendance where id = p_attendance_id;
  perform public.recompute_enrollment_usage(v_row.enrollment_id);
end;
$$;

revoke execute on function public.mark_attendance(uuid, date, public.attendance_status, public.session_kind, boolean, uuid, text) from anon;
revoke execute on function public.unmark_attendance(uuid) from anon;

-- Ghi danh mới (tái đăng ký) mở chu kỳ chăm sóc mới.
create or replace function public.tg_enrollment_renewal_reset()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.renewal_followups where student_id = new.student_id and paid;
  return new;
end;
$$;

create trigger enrollments_renewal_reset after insert on public.enrollments
  for each row execute function public.tg_enrollment_renewal_reset();

-- ---------------------------------------------------------------------------
-- View cảnh báo (security_invoker: áp RLS của người xem).
-- ---------------------------------------------------------------------------

create view public.v_student_remaining
with (security_invoker = true) as
select
  s.id as student_id,
  s.org_id,
  s.center_id,
  s.full_name,
  s.parent_name,
  s.parent_phone,
  s.chess_level,
  coalesce(sum(greatest(e.total_lessons - e.used_lessons, 0))
    filter (where e.status = 'active' and e.price > 0), 0)::int as remaining_lessons,
  count(e.id) filter (where e.status = 'active')::int as active_enrollments
from public.students s
left join public.enrollments e on e.student_id = s.id
where s.status <> 'stopped'
group by s.id;

create view public.v_low_remaining
with (security_invoker = true) as
select v.*, o.low_remaining_threshold as threshold, rf.following_up, rf.invoice_sent, rf.paid, rf.note as followup_note
from public.v_student_remaining v
join public.organizations o on o.id = v.org_id
left join public.renewal_followups rf on rf.student_id = v.student_id
where v.active_enrollments > 0 and v.remaining_lessons <= o.low_remaining_threshold;

-- Vắng liên tiếp: 2 buổi mới nhất trong 5 buổi gần nhất đều vắng.
create view public.v_consecutive_absences
with (security_invoker = true) as
with ranked as (
  select
    a.student_id,
    a.session_date,
    a.status,
    row_number() over (partition by a.student_id order by a.session_date desc, a.marked_at desc) as rn
  from public.attendance a
)
select
  s.id as student_id,
  s.org_id,
  s.center_id,
  s.full_name,
  s.parent_name,
  s.parent_phone,
  max(r.session_date) filter (where r.rn = 1) as last_absence_date
from ranked r
join public.students s on s.id = r.student_id
where r.rn <= 2 and s.status = 'active'
group by s.id
having count(*) = 2 and bool_and(r.status <> 'present');
