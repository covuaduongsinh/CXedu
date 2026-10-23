-- Dữ liệu mẫu cho môi trường local — KHÔNG dùng cho production.
-- Tài khoản: thay.tuong@cxedu.local / CXedu@2026 (owner), gv.lan@cxedu.local / CXedu@2026 (giáo viên).

do $$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_teacher uuid := '22222222-2222-4222-8222-222222222222';
  v_org uuid := 'a0000000-0000-4000-8000-000000000001';
  v_center uuid := 'c0000000-0000-4000-8000-000000000001';
  v_room1 uuid := 'd0000000-0000-4000-8000-000000000001';
  v_room2 uuid := 'd0000000-0000-4000-8000-000000000002';
  v_levels public.chess_level[] := array['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
  v_course_names text[] := array['Cấp Tốt — Nhập môn', 'Cấp Mã — Chiến thuật cơ bản', 'Cấp Tượng — Khai cuộc',
    'Cấp Xe — Trung cuộc', 'Cấp Hậu — Tàn cuộc nâng cao', 'Cấp Vua — Thi đấu'];
  v_course_lessons int[] := array[16, 16, 20, 20, 24, 24];
  v_course_prices bigint[] := array[2400000, 2600000, 3200000, 3600000, 4800000, 5400000];
  v_names text[] := array['Nguyễn Minh An', 'Trần Gia Bảo', 'Lê Khánh Chi', 'Phạm Đức Duy', 'Hoàng Bảo Ngọc',
    'Vũ Hải Đăng', 'Đặng Thu Hà', 'Bùi Quang Huy', 'Đỗ Mai Linh', 'Ngô Tuấn Kiệt', 'Dương Phương Nhi', 'Lý Thành Long'];
  v_parents text[] := array['Nguyễn Thị Hoa', 'Trần Văn Nam', 'Lê Thu Trang', 'Phạm Quốc Hùng', 'Hoàng Thị Lan',
    'Vũ Minh Tuấn', 'Đặng Thị Mai', 'Bùi Văn Thắng', 'Đỗ Thị Hằng', 'Ngô Đức Anh', 'Dương Thị Thảo', 'Lý Văn Sơn'];
  -- Cấp (1..6) và số buổi đã học của từng học viên; một số học viên sắp hết buổi.
  v_student_level int[] := array[1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6];
  v_attended int[] := array[14, 6, 15, 9, 13, 4, 18, 10, 12, 17, 21, 8];
  v_courses uuid[] := '{}';
  v_slots uuid[] := '{}';
  v_course uuid;
  v_slot uuid;
  v_student uuid;
  v_enrollment uuid;
  v_status public.attendance_status;
  i int;
  k int;
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new)
  values
    ('00000000-0000-0000-0000-000000000000', v_owner, 'authenticated', 'authenticated', 'thay.tuong@cxedu.local',
     extensions.crypt('CXedu@2026', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Thầy Tường"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_teacher, 'authenticated', 'authenticated', 'gv.lan@cxedu.local',
     extensions.crypt('CXedu@2026', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Cô Lan"}', now(), now(), '', '', '', '');

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), v_owner::text, v_owner,
     jsonb_build_object('sub', v_owner::text, 'email', 'thay.tuong@cxedu.local', 'email_verified', true),
     'email', now(), now(), now()),
    (gen_random_uuid(), v_teacher::text, v_teacher,
     jsonb_build_object('sub', v_teacher::text, 'email', 'gv.lan@cxedu.local', 'email_verified', true),
     'email', now(), now(), now());

  insert into public.organizations (id, name, phone, address, invoice_prefix, low_remaining_threshold, created_by)
  values (v_org, 'CLB Cờ vua Dương Sinh', '0983119819',
    'Số 7 ngõ 69 Tôn Đức Thắng, Quốc Tử Giám, Đống Đa, Hà Nội', 'DS', 4, v_owner);

  insert into public.memberships (org_id, user_id, role, display_name) values
    (v_org, v_owner, 'owner', 'Thầy Tường'),
    (v_org, v_teacher, 'teacher', 'Cô Lan');

  insert into public.centers (id, org_id, name, address, phone, bank_bin, bank_account, bank_holder, course_rules)
  values (v_center, v_org, 'Cơ sở Tôn Đức Thắng', 'Số 7 ngõ 69 Tôn Đức Thắng, Đống Đa, Hà Nội', '0983119819',
    '970436', '0011001932418', 'CONG TY CP CO VUA DUONG SINH',
    'Học phí đã đóng không hoàn lại. Vắng có phép báo trước 2 giờ để được xếp học bù.');

  insert into public.rooms (id, org_id, center_id, name, capacity) values
    (v_room1, v_org, v_center, 'Phòng Khai cuộc', 12),
    (v_room2, v_org, v_center, 'Phòng Tàn cuộc', 10);

  for i in 1..6 loop
    insert into public.courses (org_id, name, chess_level, price, total_lessons, max_excused_absences, description)
      values (v_org, v_course_names[i], v_levels[i], v_course_prices[i], v_course_lessons[i], 2,
        'Lộ trình ' || v_course_names[i] || ' theo giáo trình Dương Sinh.')
      returning id into v_course;
    v_courses := v_courses || v_course;
    -- Mỗi cấp một lớp: cấp 1–3 học tối T3/T5, cấp 4–6 học sáng T7/CN.
    insert into public.class_slots (org_id, center_id, course_id, room_id, teacher_id, name, weekday, start_time, end_time, max_students)
      values (v_org, v_center, v_course, case when i <= 3 then v_room1 else v_room2 end, v_teacher,
        'Lớp ' || split_part(v_course_names[i], ' — ', 1),
        case when i <= 3 then 2 else 6 end,
        case when i <= 3 then time '17:30' + (i - 1) * interval '0 minutes' else time '08:00' + (i - 4) * interval '100 minutes' end,
        case when i <= 3 then time '19:00' else time '09:30' + (i - 4) * interval '100 minutes' end,
        12)
      returning id into v_slot;
    v_slots := v_slots || v_slot;
  end loop;

  for i in 1..array_length(v_names, 1) loop
    insert into public.students (org_id, center_id, full_name, birthday, chess_level, rating, parent_name, parent_phone,
      parent_email, enrolled_on, created_by)
    values (v_org, v_center, v_names[i],
      case when i = 3 then current_date - interval '8 years' else date '2016-01-15' + (i * 37) end,
      v_levels[v_student_level[i]], 800 + v_student_level[i] * 120 + i * 7,
      v_parents[i], '09' || lpad((12345670 + i * 1111)::text, 8, '0'), null,
      current_date - (v_attended[i] * 4 + 10), v_owner)
    returning id into v_student;

    insert into public.enrollments (org_id, student_id, course_id, start_date, total_lessons, price)
      values (v_org, v_student, v_courses[v_student_level[i]], current_date - (v_attended[i] * 4 + 10),
        v_course_lessons[v_student_level[i]], v_course_prices[v_student_level[i]])
      returning id into v_enrollment;
    insert into public.enrollment_schedules (enrollment_id, class_slot_id, org_id)
      values (v_enrollment, v_slots[v_student_level[i]], v_org);

    for k in 1..v_attended[i] loop
      v_status := case
        -- Học viên 4 và 9 vắng 2 buổi gần nhất → cảnh báo vắng liên tiếp.
        when i in (4, 9) and k > v_attended[i] - 2 then (case when k % 2 = 0 then 'excused' else 'unexcused' end)::public.attendance_status
        when k % 7 = 0 then 'excused'::public.attendance_status
        else 'present'::public.attendance_status
      end;
      insert into public.attendance (org_id, center_id, enrollment_id, student_id, class_slot_id, session_date, status, marked_by)
        values (v_org, v_center, v_enrollment, v_student, v_slots[v_student_level[i]],
          current_date - ((v_attended[i] - k) * 4 + 1), v_status, v_teacher);
    end loop;
    perform public.recompute_enrollment_usage(v_enrollment);
  end loop;

  insert into public.leads (org_id, center_id, parent_name, parent_phone, student_name, student_birthday, entry_level, status, source, created_by)
  values
    (v_org, v_center, 'Chu Thị Bích', '0912000111', 'Chu Gia Hưng', date '2019-05-02', 'pawn', 'new', 'Facebook', v_owner),
    (v_org, v_center, 'Mạc Văn Tài', '0912000222', 'Mạc Bảo Anh', date '2018-09-10', 'knight', 'caring', 'Giới thiệu', v_owner);

  insert into public.teacher_pay_rates (org_id, teacher_id, mode, session_rate, student_rate, threshold)
    values (v_org, v_teacher, 'flex', 250000, 30000, 6);
end;
$$;
