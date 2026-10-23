"use client";

import { useActionState } from "react";

import { Button, Field, FormMessage, Input } from "@/components/ui";

import { createOrganization } from "./actions";

export const OnboardingForm = () => {
  const [state, action, pending] = useActionState(createOrganization, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Tên trung tâm / CLB">
        <Input name="name" placeholder="CLB Cờ vua Dương Sinh" required />
      </Field>
      <Field
        label="Tên cơ sở đầu tiên"
        hint="Có thể thêm cơ sở khác sau trong Cài đặt"
      >
        <Input name="centerName" placeholder="Cơ sở chính" />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" variant="accent" disabled={pending}>
        Bắt đầu dùng thử 30 ngày
      </Button>
    </form>
  );
};
