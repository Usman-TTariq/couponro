import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getCookieName,
  getSessionCookieOptions,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";
    const expected =
      process.env.ADMIN_PASSWORD ??
      (process.env.NODE_ENV === "development" ? "admin123" : "");
    if (!expected) {
      return NextResponse.json(
        { error: "Admin login is not configured." },
        { status: 500 }
      );
    }
    if (password !== expected) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 }
      );
    }
    const value = await createSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(getCookieName(), value, getSessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json(
      { error: "Login failed." },
      { status: 500 }
    );
  }
}
