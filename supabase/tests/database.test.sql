-- pgTAP: phân quyền đa tenant, quy tắc trừ buổi, hóa đơn, cổng phụ huynh, check-in QR.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

-- Người dùng của một trung tâm khác.
insert into auth.users (id, email, aud, role) values
  ('33333333-3333-4333-8333-333333333333', 'chu.trung.tam.khac@cxedu.local', 'authenticated', 'authenticated');

create temporary table ids on commit drop as
select
  (select e.id from public.enrollments e join public.students s on s.id = e.student_id where s.full_name = 'Trần Gia Bảo') as enrollment_id,
  (select id from public.students where full_name = 'Trần Gia Bảo') as student_id,
  'c0000000-0000-4000-8000-000000000001'::uuid as center_id,
  (select count(*) from public.students where center_id = 'c0000000-0000-4000-8000-000000000001')::int as center_students;
grant select on ids to authenticated, anon;

-- Mã QR hiện tại (now() cố định trong transaction nên khớp với lúc teacher_checkin chạy).
create temporary table checkin_code on commit drop as
select public.rotating_code(checkin_secret, center_id, floor(extract(epoch from now()) / 45)::bigint) as code
from public.center_secrets where center_id = 'c0000000-0000-4000-8000-000000000001';
grant select on checkin_code to authenticated;

-- ---------------------------------------------------------------- người lạ
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';

select is((select count(*) from public.students)::int, 0, 'Người ngoài tổ chức không thấy học viên');
select is((select count(*) from public.invoices)::int, 0, 'Người ngoài tổ chức không thấy hóa đơn');
select throws_ok(
  $$ select public.mark_attendance((select enrollment_id from ids), current_date, 'present') $$,
  '42501', null, 'Người ngoài không điểm danh được');

select lives_ok($$ select public.create_organization('Trung tâm Cờ Hà Đông', 'Cơ sở 1') $$,
  'Người dùng mới tự tạo được tổ chức của mình');
select is((select count(*) from public.centers)::int, 1, 'Chỉ thấy cơ sở của tổ chức mình');
select is((select status::text from public.subscriptions), 'trialing', 'Tổ chức mới có gói dùng thử');

-- ---------------------------------------------------------------- giáo viên
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

select is((select count(*) from public.students)::int, (select center_students from ids), 'Giáo viên thấy toàn bộ học viên cơ sở mình');
select is((select count(*) from public.invoices)::int, 0, 'Giáo viên không xem được hóa đơn');
select throws_ok(
  $$ insert into public.courses (org_id, name, total_lessons) values ('a0000000-0000-4000-8000-000000000001', 'Khóa lạ', 10) $$,
  '42501', null, 'Giáo viên không tạo được khóa học');

-- Trần Gia Bảo: 16 buổi, đã học 6 (có 0 buổi vắng), hạn mức vắng có phép = 2.
select is((select public.mark_attendance((select enrollment_id from ids), current_date + 1, 'present')).charged::int,
  1, 'Đi học trừ 1 buổi');
select is((select used_lessons from public.enrollments where id = (select enrollment_id from ids)), 7, 'Đã dùng 7 buổi');
select is((select public.mark_attendance((select enrollment_id from ids), current_date + 2, 'excused')).charged::int,
  0, 'Vắng có phép trong hạn mức không trừ');
select is((select public.mark_attendance((select enrollment_id from ids), current_date + 3, 'excused')).charged::int,
  0, 'Vắng có phép lần 2 vẫn trong hạn mức');
select is((select public.mark_attendance((select enrollment_id from ids), current_date + 4, 'excused')).charged::int,
  1, 'Vắng có phép vượt hạn mức thì trừ');
select is((select public.mark_attendance((select enrollment_id from ids), current_date + 1, 'unexcused')).charged::int,
  1, 'Sửa điểm danh không cộng dồn buổi');
select is((select used_lessons from public.enrollments where id = (select enrollment_id from ids)), 8, 'Tổng đã dùng = 8');

select throws_ok(
  $$ select public.teacher_checkin((select center_id from ids), '0000000000000000') $$,
  '22023', null, 'Mã QR sai/hết hạn bị từ chối');
select lives_ok(
  $$ select public.teacher_checkin((select center_id from ids), (select code from checkin_code)) $$,
  'Giáo viên check-in bằng mã QR hiện tại');
select throws_ok(
  $$ select public.current_checkin_code((select center_id from ids)) $$,
  '42501', null, 'Giáo viên không mở được màn hình mã QR của lễ tân');

-- ---------------------------------------------------------------- owner: hóa đơn + thanh toán
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

create temporary table inv on commit drop as
select * from public.create_invoice(
  (select center_id from ids),
  '[{"description":"Gia hạn Cấp Tốt 16 buổi","quantity":1,"unit_price":2400000}]'::jsonb,
  (select student_id from ids), 100000);

select is((select total from public.invoices where id = (select id from inv)), 2300000::bigint, 'Tổng = dòng − giảm giá');
insert into public.payments (org_id, invoice_id, student_id, amount, method)
  select org_id, id, student_id, 2300000, 'transfer' from inv;
select is((select status::text from public.invoices where id = (select id from inv)), 'paid', 'Thu đủ → đã thanh toán');
select ok((select paid from public.renewal_followups where student_id = (select student_id from ids)),
  'Tái đăng ký được đánh dấu đã đóng');

-- ---------------------------------------------------------------- phụ huynh (anon)
set local role anon;
select ok(
  public.get_parent_portal((select parent_token from public.students where full_name = 'Trần Gia Bảo'), '0000') is null
  and (select count(*) from public.students) = 0,
  'Sai 4 số cuối thì không xem được; anon không đọc bảng học viên');

select * from finish();
rollback;
