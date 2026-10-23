import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/cx/server";

/** Cấp JWT ngắn hạn cho code chạy trên trình duyệt (bảng điểm danh, kiosk, realtime). */
export async function GET() {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  return NextResponse.json(
    { accessToken: session.accessToken, expiresAt: session.expiresAt },
    { headers: { "Cache-Control": "no-store" } },
  );
}
