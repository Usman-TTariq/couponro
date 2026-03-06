import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, getCookieName } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }
  const cookie = request.cookies.get(getCookieName())?.value;
  const valid = await verifySession(cookie);
  if (!valid) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
