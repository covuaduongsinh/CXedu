import type { Metadata } from "next";

import { Logo } from "@/components/Logo";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const next =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-primary p-10 text-white md:flex md:flex-col md:justify-between">
        <div
          className="chess-pattern absolute inset-0 opacity-10"
          aria-hidden
        />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative">
          <p className="text-3xl font-bold">
            Giữ chân học viên, không bỏ sót phụ huynh.
          </p>
          <p className="mt-3 text-white/70">Vui trí tuệ · Dương Sinh</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <Logo />
          </div>
          <h1 className="mb-6 text-2xl font-bold text-primary">
            Chào mừng trở lại
          </h1>
          <LoginForm
            next={next}
            initialMode={params.mode === "signup" ? "signup" : "signin"}
          />
        </div>
      </section>
    </main>
  );
}
