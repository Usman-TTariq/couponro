import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=0, must-revalidate",
};
import {
  getCoupons,
  getCouponsPaginated,
  insertCoupon,
  updateCoupon,
  deleteCoupon,
  deleteAllCoupons,
} from "@/lib/stores";
import type { Store } from "@/types/store";
import { slugify } from "@/lib/slugify";

const SUPABASE_REQUEST_TIMEOUT_MS = 20000;

function newId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("SUPABASE_TIMEOUT")), ms)
    ),
  ]);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    if (page !== null || limit !== null) {
      const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const parsedLimit = parseInt(limit ?? "20", 10);
      const limitNum = limit === "0" ? 0 : Math.min(100, Math.max(0, parsedLimit) || 20);
      const status = (searchParams.get("status") ?? "all") as "all" | "enable" | "disable";
      const q = searchParams.get("q") ?? "";
      const codesFirst = searchParams.get("codes_first") === "1" || searchParams.get("codesFirst") === "true";
      const fresh = searchParams.get("fresh") === "1" || searchParams.get("fresh") === "true";
      const { coupons, total } = await withTimeout(
        getCouponsPaginated(
          {
            page: pageNum,
            limit: limitNum,
            status: status === "enable" || status === "disable" ? status : "all",
            search: q,
            codesFirst,
          },
          fresh
        ),
        SUPABASE_REQUEST_TIMEOUT_MS
      );
      return NextResponse.json({ coupons, total }, { headers: CACHE_HEADERS });
    }
    const coupons = await withTimeout(getCoupons(), SUPABASE_REQUEST_TIMEOUT_MS);
    return NextResponse.json(coupons, { headers: CACHE_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const isTimeout = msg === "SUPABASE_TIMEOUT";
    const isFetchFailed = /fetch failed|ECONNREFUSED|ETIMEDOUT|522/i.test(msg || String(e));
    console.error("[api/coupons] GET:", e);
    const userMsg =
      isTimeout || isFetchFailed
        ? "Supabase connection failed or timed out (e.g. Cloudflare 522). Check: 1) Project not paused (Supabase Dashboard). 2) COUPONS_SUPABASE_URL is correct. 3) Network/firewall."
        : "Failed to load coupons";
    return NextResponse.json(
      { error: userMsg },
      { status: 503, headers: CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }
    const slug = body?.slug?.trim() || slugify(name);
    const id = body?.id?.trim() || newId();
    const coupon: Store = {
      id,
      name,
      slug,
      logoUrl: body?.logoUrl ?? "",
      description: body?.description ?? "",
      expiry: body?.expiry ?? "Dec 31, 2026",
      link: body?.link ?? undefined,
      createdAt: new Date().toISOString(),
      status: body?.status ?? "enable",
      couponType: body?.couponType ?? "code",
      couponCode: body?.couponCode ?? "",
      couponTitle: body?.couponTitle ?? "",
      showCodeButtonText:
        typeof body?.showCodeButtonText === "string" ? body.showCodeButtonText.trim() || undefined : undefined,
      badgeLabel: body?.badgeLabel ?? undefined,
      priority: typeof body?.priority === "number" ? body.priority : 0,
      active: body?.active !== false,
      verified: body?.verified !== false,
    };
    await insertCoupon(coupon);
    revalidateTag("coupons");
    return NextResponse.json(coupon);
  } catch (e) {
    console.error("[api/coupons] POST:", e);
    const msg = e instanceof Error ? e.message : "Failed to create coupon";
    const isConfig = /supabase|not configured|env\.local/i.test(msg);
    return NextResponse.json(
      { error: isConfig ? "Supabase not configured for local. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local (same as live)." : msg },
      { status: isConfig ? 503 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const slug = body?.slug?.trim() || (name ? slugify(name) : "");
    const coupon: Store = {
      id,
      name: (name || body?.name) ?? "",
      slug: (slug || body?.slug) ?? "",
      logoUrl: body?.logoUrl ?? "",
      description: body?.description ?? "",
      expiry: body?.expiry ?? "Dec 31, 2026",
      link: body?.link ?? undefined,
      createdAt: body?.createdAt,
      status: body?.status ?? "enable",
      couponType: body?.couponType ?? "code",
      couponCode: body?.couponCode ?? "",
      couponTitle: body?.couponTitle ?? "",
      showCodeButtonText:
        typeof body?.showCodeButtonText === "string" ? body.showCodeButtonText.trim() || undefined : undefined,
      badgeLabel: body?.badgeLabel ?? undefined,
      priority: typeof body?.priority === "number" ? body.priority : 0,
      active: body?.active !== false,
      verified: body?.verified !== false,
    };
    await updateCoupon(id, coupon);
    revalidateTag("coupons");
    return NextResponse.json(coupon);
  } catch (e) {
    console.error("[api/coupons] PUT:", e);
    const msg = e instanceof Error ? e.message : "Failed to update coupon";
    const isConfig = /supabase|not configured|env\.local/i.test(msg);
    return NextResponse.json(
      { error: isConfig ? "Supabase not configured for local. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local (same as live)." : msg },
      { status: isConfig ? 503 : 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      await deleteAllCoupons();
      revalidateTag("coupons");
      return NextResponse.json({ ok: true });
    }
    await deleteCoupon(id);
    revalidateTag("coupons");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/coupons] DELETE:", e);
    const msg = e instanceof Error ? e.message : "Failed to delete coupon";
    const isConfig = /supabase|not configured|env\.local/i.test(msg);
    return NextResponse.json(
      { error: isConfig ? "Supabase not configured for local. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local (same as live)." : msg },
      { status: isConfig ? 503 : 500 }
    );
  }
}
