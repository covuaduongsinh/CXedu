import type { Metadata } from "next";

import { requireAdmin } from "@/lib/session";

import { DesktopKioskButton } from "./DesktopKioskButton";
import { KioskQr } from "./KioskQr";

export const metadata: Metadata = { title: "QR check-in" };

export default async function KioskPage() {
  const context = await requireAdmin();
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-bold text-primary">QR check-in giáo viên</h1>
      <p className="max-w-md text-sm text-muted">
        Mở màn hình này tại lễ tân {context.center.name}. Mã tự đổi mỗi 45 giây
        nên ảnh chụp lại không dùng được; giáo viên quét bằng app CXedu để
        check-in ca dạy.
      </p>
      <KioskQr centerId={context.center.id} />
      <DesktopKioskButton />
    </div>
  );
}
