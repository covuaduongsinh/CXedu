import type { ReactNode } from "react";

import { Logo } from "@/components/Logo";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { getAppContext } from "@/lib/session";

import { signOut } from "../login/actions";
import { switchCenter } from "./context-actions";

const ROLE_LABELS = {
  owner: "Chủ trung tâm",
  admin: "Quản lý",
  teacher: "Giáo viên",
} as const;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const context = await getAppContext();
  return (
    <Providers>
      <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
        <aside className="no-print bg-primary p-4 text-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-6">
          <div className="mb-4 flex items-center justify-between md:mb-0 md:block">
            <Logo light />
            <p className="mt-0 text-xs text-white/60 md:mt-2">
              {context.org.name}
            </p>
          </div>
          {context.centers.length > 1 && (
            <form action={switchCenter} className="mb-4 md:mb-0">
              <select
                name="centerId"
                defaultValue={context.center.id}
                className="w-full rounded-md bg-white/10 px-2 py-1.5 text-sm text-white"
                aria-label="Chọn cơ sở"
              >
                {context.centers.map((center) => (
                  <option
                    key={center.id}
                    value={center.id}
                    className="text-ink"
                  >
                    {center.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="mt-1 text-xs text-gold underline"
              >
                Đổi cơ sở
              </button>
            </form>
          )}
          <Sidebar isAdmin={context.isAdmin} />
          <div className="mt-auto hidden text-xs text-white/70 md:block">
            <p className="truncate">{context.email}</p>
            <p>
              {ROLE_LABELS[context.role]} · {context.center.name}
            </p>
            <form action={signOut}>
              <button type="submit" className="mt-2 text-gold underline">
                Đăng xuất
              </button>
            </form>
          </div>
        </aside>
        <main className="mx-auto w-full max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </Providers>
  );
}
