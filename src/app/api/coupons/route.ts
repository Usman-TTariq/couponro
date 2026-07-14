import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=0, must-revalidate",
};
import {
  getCoupons,
  getCouponsPaginated,
  getCouponsForStore,
  getCouponCountsByStoreName,
  getCouponByIdRaw,
  insertCoupon,
  updateCoupon,
  deleteCoupon,
  deleteAllCoupons,
} from "@/lib/stores";
import type { Store } from "@/types/store";
import { slugify } from "@/lib/slugify";
import { repairCouponTextFields } from "@/lib/fix-text-encoding";

const SUPABASE_REQUEST_TIMEOUT_MS = 45000;
const SUPABASE_FULL_LIST_TIMEOUT_MS = 90000;

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

    if (searchParams.get("counts") === "1") {
      const counts = await withTimeout(
        getCouponCountsByStoreName(),
        SUPABASE_FULL_LIST_TIMEOUT_MS
      );
      return NextResponse.json({ counts }, { headers: CACHE_HEADERS });
    }

    const storeName = (searchParams.get("storeName") ?? "").trim();
    if (storeName) {
      const coupons = await withTimeout(
        getCouponsForStore({
          slug: "",
          storeName,
          includeDisabled: true,
        }),
        SUPABASE_REQUEST_TIMEOUT_MS
      );
      return NextResponse.json({ coupons }, { headers: CACHE_HEADERS });
    }

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
        limitNum === 0 ? SUPABASE_FULL_LIST_TIMEOUT_MS : SUPABASE_REQUEST_TIMEOUT_MS
      );
      return NextResponse.json({ coupons, total }, { headers: CACHE_HEADERS });
    }
    const coupons = await withTimeout(getCoupons(), SUPABASE_FULL_LIST_TIMEOUT_MS);
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
    const linkTrim =
      typeof body?.link === "string" ? body.link.trim() : "";
    const link = linkTrim || undefined;
    const trackingTrim =
      typeof body?.trackingUrl === "string" ? body.trackingUrl.trim() : "";
    const trackingUrl = trackingTrim || linkTrim || undefined;
    const coupon: Store = {
      id,
      name,
      slug,
      logoUrl: body?.logoUrl ?? "",
      description: body?.description ?? "",
      expiry: body?.expiry ?? "Dec 31, 2026",
      link,
      trackingUrl,
      createdAt: new Date().toISOString(),
      status: body?.status ?? "enable",
      couponType: body?.couponType ?? "code",
      couponCode: body?.couponCode ?? "",
      couponTitle: body?.couponTitle ?? "",
      showCodeButtonText:
        typeof body?.showCodeButtonText === "string" ? body.showCodeButtonText.trim() || undefined : undefined,
      badgeLabel:
        typeof body?.badgeLabel === "string"
          ? body.badgeLabel.trim() || undefined
          : undefined,
      priority: typeof body?.priority === "number" ? body.priority : 0,
      active: body?.active !== false,
      verified: body?.verified !== false,
      freeShipping: body?.freeShipping === true,
    };
    const saved = repairCouponTextFields(coupon);
    await insertCoupon(saved);
    revalidateTag("coupons");
    return NextResponse.json(saved);
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
    const existing = await getCouponByIdRaw(id);
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    const name =
      typeof body?.name === "string" ? body.name.trim() : existing.name ?? "";
    const slug =
      (typeof body?.slug === "string" ? body.slug.trim() : "") ||
      existing.slug ||
      (name ? slugify(name) : "");
    const linkTrim =
      typeof body?.link === "string" ? body.link.trim() : existing.link ?? "";
    const link = linkTrim || undefined;
    const trackingTrim =
      typeof body?.trackingUrl === "string" ? body.trackingUrl.trim() : "";
    // Coupon URL (link) is canonical — do not keep a stale trackingUrl when link changes
    const trackingUrl = linkTrim || trackingTrim || undefined;
    const badgeLabel =
      "badgeLabel" in body && body.badgeLabel != null
        ? String(body.badgeLabel).trim() || undefined
        : existing.badgeLabel;
    const coupon: Store = {
      ...existing,
      id,
      name,
      slug,
      logoUrl:
        typeof body?.logoUrl === "string" ? body.logoUrl : existing.logoUrl ?? "",
      description:
        typeof body?.description === "string"
          ? body.description
          : existing.description ?? "",
      expiry:
        typeof body?.expiry === "string"
          ? body.expiry
          : existing.expiry ?? "Dec 31, 2026",
      link,
      trackingUrl,
      status: body?.status ?? existing.status ?? "enable",
      couponType: body?.couponType ?? existing.couponType ?? "code",
      couponCode:
        typeof body?.couponCode === "string"
          ? body.couponCode
          : existing.couponCode ?? "",
      couponTitle:
        typeof body?.couponTitle === "string"
          ? body.couponTitle
          : existing.couponTitle ?? "",
      showCodeButtonText:
        typeof body?.showCodeButtonText === "string"
          ? body.showCodeButtonText.trim() || undefined
          : existing.showCodeButtonText,
      badgeLabel,
      priority:
        typeof body?.priority === "number" ? body.priority : existing.priority ?? 0,
      active: body?.active !== undefined ? body.active !== false : existing.active !== false,
      verified:
        body?.verified !== undefined ? body.verified !== false : existing.verified !== false,
      freeShipping:
        "freeShipping" in body
          ? body.freeShipping === true
          : existing.freeShipping === true,
    };
    const saved = repairCouponTextFields(coupon);
    await updateCoupon(id, saved);
    revalidateTag("coupons");
    const storeSlug = (saved.slug ?? slugify(saved.name ?? "")).trim();
    if (storeSlug) revalidatePath(`/stores/${storeSlug}`);
    return NextResponse.json(saved);
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
