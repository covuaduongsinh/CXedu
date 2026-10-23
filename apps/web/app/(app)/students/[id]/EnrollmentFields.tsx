"use client";

import { useState } from "react";
import { WEEKDAY_LABELS, formatVnd } from "@cxedu/core";

import { Field, Input, Select } from "@/components/ui";

interface Props {
  courses: { id: string; name: string; total_lessons: number; price: number }[];
  slots: {
    id: string;
    name: string;
    weekday: number;
    start_time: string;
    course_id: string | null;
  }[];
  today: string;
}

/** Chọn khóa → tự điền số buổi, học phí và gợi ý lớp đúng khóa. */
export const EnrollmentFields = ({ courses, slots, today }: Props) => {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const course = courses.find((item) => item.id === courseId);
  return (
    <>
      <Field label="Khóa học">
        <Select
          name="courseId"
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          required
        >
          {courses.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Số buổi">
          <Input
            key={`l-${courseId}`}
            name="totalLessons"
            type="number"
            min={1}
            defaultValue={course?.total_lessons ?? 8}
            required
          />
        </Field>
        <Field
          label="Học phí (đ)"
          hint={course ? `Niêm yết ${formatVnd(course.price)}` : undefined}
        >
          <Input
            key={`p-${courseId}`}
            name="price"
            type="number"
            min={0}
            step={1000}
            defaultValue={course?.price ?? 0}
          />
        </Field>
      </div>
      <Field label="Ngày bắt đầu">
        <Input name="startDate" type="date" defaultValue={today} required />
      </Field>
      <fieldset className="flex flex-col gap-1 text-sm">
        <legend className="mb-1 font-medium">Lớp học hằng tuần</legend>
        {slots.length === 0 && (
          <p className="text-xs text-muted">
            Chưa có lớp. Tạo lớp ở trang Lớp & lịch.
          </p>
        )}
        {slots.map((slot) => (
          <label key={slot.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="slotIds"
              value={slot.id}
              defaultChecked={slot.course_id === courseId}
              key={`${slot.id}-${courseId}`}
            />
            {slot.name} · {WEEKDAY_LABELS[slot.weekday]}{" "}
            {slot.start_time.slice(0, 5)}
          </label>
        ))}
      </fieldset>
    </>
  );
};
