"use client";

import { useActionState } from "react";
import { formatVnd, getChessLevel, type ChessLevelId } from "@cxedu/core";

import {
  Badge,
  Button,
  Card,
  Field,
  FormMessage,
  Input,
} from "@/components/ui";

import { openPortal, type PortalData } from "./actions";

const fmt = (value: string) =>
  value.slice(0, 10).split("-").reverse().join("/");
const STATUS = {
  present: { text: "Có mặt", tone: "green" },
  excused: { text: "Vắng có phép", tone: "gold" },
  unexcused: { text: "Vắng không phép", tone: "danger" },
} as const;

const PortalView = ({ data }: { data: PortalData }) => (
  <div className="flex flex-col gap-4">
    <Card>
      <p className="text-sm text-muted">
        Xin chào anh/chị {data.student.parent_name ?? ""}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-primary">
        {data.student.full_name}
      </h1>
      <p className="text-sm">
        Cấp {getChessLevel(data.student.chess_level as ChessLevelId).name} · Elo{" "}
        {data.student.rating ?? "—"} · {data.center?.name}
      </p>
    </Card>
    <Card title="Tiến độ khóa học">
      {data.enrollments.map((e) => (
        <div key={`${e.course}-${e.start_date}`} className="mb-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{e.course}</span>
            <span>
              {e.used_lessons}/{e.total_lessons} buổi
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-primary"
              style={{
                width: `${Math.min((e.used_lessons / e.total_lessons) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted">
            Còn {Math.max(e.total_lessons - e.used_lessons, 0)} buổi
            {e.expected_end_date
              ? ` · dự kiến xong ${fmt(e.expected_end_date)}`
              : ""}
          </p>
        </div>
      ))}
    </Card>
    <Card title="Buổi học gần đây">
      <ul className="grid grid-cols-2 gap-2">
        {data.attendance.slice(0, 12).map((a) => (
          <li
            key={`${a.date}-${a.kind}`}
            className="flex items-center justify-between rounded-md bg-bg px-2 py-1 text-xs"
          >
            {fmt(a.date)}{" "}
            <Badge tone={STATUS[a.status].tone}>{STATUS[a.status].text}</Badge>
          </li>
        ))}
      </ul>
    </Card>
    {data.reviews.length > 0 && (
      <Card title="Nhận xét của giáo viên">
        {data.reviews.map((r) => (
          <p key={r.date} className="mb-2 rounded-md bg-bg p-3 text-sm">
            {r.body}
          </p>
        ))}
      </Card>
    )}
    {data.invoices.length > 0 && (
      <Card title="Học phí">
        <ul className="flex flex-col gap-2 text-sm">
          {data.invoices.map((i) => (
            <li key={i.number} className="flex justify-between">
              <span>
                {i.number} · {fmt(i.issue_date)}
              </span>
              <span>
                {i.status === "paid" ? (
                  <Badge tone="green">Đã đóng</Badge>
                ) : (
                  <Badge tone="orange">Còn {formatVnd(i.total - i.paid)}</Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    )}
    <p className="text-center text-xs text-muted">
      {data.center?.org_name} · {data.center?.phone} · Vui trí tuệ
    </p>
  </div>
);

export const Portal = ({ token }: { token: string }) => {
  const [state, action, pending] = useActionState(openPortal, null);
  if (state?.data) return <PortalView data={state.data} />;
  return (
    <Card title="Xác minh phụ huynh">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <Field label="4 số cuối điện thoại phụ huynh">
          <Input
            name="suffix"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            required
            autoComplete="off"
          />
        </Field>
        <FormMessage state={state} />
        <Button type="submit" disabled={pending}>
          Xem thông tin học viên
        </Button>
      </form>
    </Card>
  );
};
