import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "cx_session";
const PUBLIC_PATHS = ["/", "/login"];

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.includes(pathname) ||
  pathname.startsWith("/p/") ||
  pathname.startsWith("/_next");

/**
 * Chặn sớm trang nội bộ khi chưa có cookie phiên. Phiên được kiểm thật với CX API
 * trong `getAppContext()` (hết hạn → chuyển về /login).
 */
export function proxy(request: NextRequest) {
  if (
    isPublic(request.nextUrl.pathname) ||
    request.cookies.has(SESSION_COOKIE)
  ) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/|favicon.ico|icons/|.*\\.(?:svg|png|jpg|webp)$).*)",
  ],
};
