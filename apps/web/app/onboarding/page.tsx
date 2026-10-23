import { Logo } from "@/components/Logo";

import { OnboardingForm } from "./OnboardingForm";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm ring-1 ring-line">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold text-primary">
          Tạo trung tâm của bạn
        </h1>
        <p className="mt-2 mb-6 text-sm text-muted">
          Bạn là chủ trung tâm (Owner). Sau đó có thể mời quản lý và giáo viên
          vào cùng làm việc.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
