"use client";

import { useActionState, useState } from "react";

import { Button, Field, FormMessage, Input } from "@/components/ui";

import { signIn, signUp } from "./actions";

export const LoginForm = ({
  next,
  initialMode,
}: {
  next: string;
  initialMode: "signin" | "signup";
}) => {
  const [mode, setMode] = useState(initialMode);
  const [signInState, signInAction, signingIn] = useActionState(signIn, null);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, null);
  const isSignUp = mode === "signup";
  return (
    <form
      action={isSignUp ? signUpAction : signInAction}
      className="flex flex-col gap-4"
    >
      <div
        className="grid grid-cols-2 rounded-md bg-bg p-1 text-sm"
        role="tablist"
      >
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={`rounded px-3 py-2 font-medium ${mode === value ? "bg-white text-primary shadow-sm" : "text-muted"}`}
          >
            {value === "signin" ? "Đăng nhập" : "Tạo trung tâm"}
          </button>
        ))}
      </div>
      <input type="hidden" name="next" value={next} />
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Mật khẩu" hint={isSignUp ? "Tối thiểu 8 ký tự" : undefined}>
        <Input
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={8}
        />
      </Field>
      <FormMessage state={isSignUp ? signUpState : signInState} />
      <Button
        type="submit"
        variant={isSignUp ? "accent" : "primary"}
        disabled={signingIn || signingUp}
      >
        {isSignUp ? "Tạo tài khoản & dùng thử 30 ngày" : "Đăng nhập"}
      </Button>
    </form>
  );
};
