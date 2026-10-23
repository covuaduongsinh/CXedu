-- CXedu · 0002 · Học vụ: khóa học (6 cấp cờ vua), lớp/khung giờ, học viên, ghi danh.

create type public.student_status as enum ('active', 'paused', 'stopped');
create type public.enrollment_status as enum ('active', 'paused', 'completed', 'stopped');

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  chess_level public.chess_level,
  description text,
  price bigint not null default 0 check (price >= 0),
  total_lessons int not null check (total_lessons between 1 and 500),
  -- null = không giới hạn số buổi vắng có phép được miễn trừ.
  max_excused_absences int check (max_excused_absences is null or max_excused_absences >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index courses_org_idx on public.courses (org_id);

-- Lớp học theo khung giờ cố định hằng tuần.
create table public.class_slots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  center_id uuid not null references public.centers (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  room_id uuid references public.rooms (id) on delete set null,
  teacher_id uuid references auth.users (id) on delete set null,
  name text not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  max_students int check (max_students is null or max_students > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index class_slots_center_weekday_idx on public.class_slots (center_id, weekday);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  center_id uuid not null references public.centers (id) on delete restrict,
  full_name text not null check (char_length(full_name) between 2 and 120),
  birthday date,
  photo_url text,
  chess_level public.chess_level not null default 'pawn',
  rating int check (rating is null or rating between 0 and 3500),
  status public.student_status not null default 'active',
  enrolled_on date not null default current_date,
  parent_name text,
  parent_phone text,
  parent_email text,
  address text,
  notes text,
  stopped_reason text,
  status_changed_at timestamptz not null default now(),
  parent_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  parent_access_enabled boolean not null default true,
  parent_last_viewed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index students_org_center_idx on public.students (org_id, center_id);
create index students_birthday_idx on public.students (org_id, (extract(month from birthday)));

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,
  start_date date not null default current_date,
  expected_end_date date,
  total_lessons int not null check (total_lessons between 1 and 500),
  used_lessons int not null default 0 check (used_lessons >= 0),
  excused_waived int not null default 0 check (excused_waived >= 0),
  price bigint not null default 0 check (price >= 0),
  status public.enrollment_status not null default 'active',
  created_at timestamptz not null default now()
);
create index enrollments_student_idx on public.enrollments (student_id);
create index enrollments_org_status_idx on public.enrollments (org_id, status);

-- Một ghi danh có thể học nhiều khung giờ mỗi tuần.
create table public.enrollment_schedules (
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  class_slot_id uuid not null references public.class_slots (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  primary key (enrollment_id, class_slot_id)
);
create index enrollment_schedules_slot_idx on public.enrollment_schedules (class_slot_id);

create table public.pauses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  check (end_date >= start_date)
);

create table public.level_history (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  from_level public.chess_level,
  to_level public.chess_level not null,
  changed_on date not null default current_date,
  note text,
  created_by uuid references auth.users (id) on delete set null
);

create table public.student_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  visible_to_parent boolean not null default true,
  created_at timestamptz not null default now()
);

-- Tự ghi lịch sử lên cấp và thời điểm đổi trạng thái học viên.
create or replace function public.tg_student_changes()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.chess_level is distinct from old.chess_level then
    insert into public.level_history (org_id, student_id, from_level, to_level, created_by)
      values (new.org_id, new.id, old.chess_level, new.chess_level, (select auth.uid()));
  end if;
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger students_changes before update on public.students
  for each row execute function public.tg_student_changes();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.courses enable row level security;
alter table public.class_slots enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.enrollment_schedules enable row level security;
alter table public.pauses enable row level security;
alter table public.level_history enable row level security;
alter table public.student_reviews enable row level security;

create policy "course: thành viên xem" on public.courses
  for select to authenticated using (public.is_org_member(org_id));
create policy "course: owner/admin quản lý" on public.courses
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "slot: thành viên xem" on public.class_slots
  for select to authenticated using (public.can_access_center(org_id, center_id));
create policy "slot: owner/admin quản lý" on public.class_slots
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "student: thành viên xem theo cơ sở" on public.students
  for select to authenticated using (public.can_access_center(org_id, center_id));
create policy "student: owner/admin quản lý" on public.students
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "enrollment: thành viên xem" on public.enrollments
  for select to authenticated using (
    exists (
      select 1 from public.students s
      where s.id = student_id and public.can_access_center(s.org_id, s.center_id)
    )
  );
create policy "enrollment: owner/admin quản lý" on public.enrollments
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "schedule: thành viên xem" on public.enrollment_schedules
  for select to authenticated using (public.is_org_member(org_id));
create policy "schedule: owner/admin quản lý" on public.enrollment_schedules
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "pause: thành viên xem" on public.pauses
  for select to authenticated using (public.is_org_member(org_id));
create policy "pause: owner/admin quản lý" on public.pauses
  for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "level: thành viên xem" on public.level_history
  for select to authenticated using (public.is_org_member(org_id));

create policy "review: thành viên xem" on public.student_reviews
  for select to authenticated using (public.is_org_member(org_id));
create policy "review: thành viên viết" on public.student_reviews
  for insert to authenticated with check (public.is_org_member(org_id) and author_id = (select auth.uid()));
create policy "review: tác giả hoặc admin sửa" on public.student_reviews
  for update to authenticated
  using (author_id = (select auth.uid()) or public.is_org_admin(org_id))
  with check (public.is_org_member(org_id));
create policy "review: tác giả hoặc admin xóa" on public.student_reviews
  for delete to authenticated using (author_id = (select auth.uid()) or public.is_org_admin(org_id));
