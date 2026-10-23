"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";

import { Button, FormMessage, cx } from "./ui";

type State = { error?: string; ok?: string } | null;

interface Props {
  action: (state: State, form: FormData) => Promise<State>;
  children: ReactNode;
  submitLabel: string;
  variant?: "primary" | "accent" | "ghost";
  className?: string;
  resetOnSuccess?: boolean;
}

/** Form dùng Server Action với thông báo lỗi/thành công thống nhất. */
export const ActionForm = ({
  action,
  children,
  submitLabel,
  variant = "primary",
  className,
  resetOnSuccess,
}: Props) => {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      ref={formRef}
      action={formAction}
      className={cx("flex flex-col gap-4", className)}
    >
      {children}
      <FormMessage state={state} />
      <div>
        <Button type="submit" variant={variant} disabled={pending}>
          {pending ? "Đang lưu…" : submitLabel}
        </Button>
      </div>
    </form>
  );
};
