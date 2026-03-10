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

function newId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
      const { coupons, total } = await getCouponsPaginated({
        page: pageNum,
        limit: limitNum,
        status: status === "enable" || status === "disable" ? status : "all",
        search: q,
        codesFirst,
      });
      return NextResponse.json({ coupons, total }, { headers: CACHE_HEADERS });
    }
    const coupons = await getCoupons();
    return NextResponse.json(coupons);
  } catch (e) {
    console.error("[api/coupons] GET:", e);
    return NextResponse.json(
      { error: "Failed to load coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      badgeLabel: body?.badgeLabel ?? undefined,
      priority: typeof body?.priority === "number" ? body.priority : 100,
      active: body?.active !== false,
    };
    await insertCoupon(coupon);
    revalidateTag("coupons");
    return NextResponse.json(coupon);
  } catch (e) {
    console.error("[api/coupons] POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create coupon" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
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
      badgeLabel: body?.badgeLabel ?? undefined,
      priority: typeof body?.priority === "number" ? body.priority : 100,
      active: body?.active !== false,
    };
    await updateCoupon(id, coupon);
    revalidateTag("coupons");
    return NextResponse.json(coupon);
  } catch (e) {
    console.error("[api/coupons] PUT:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update coupon" },
      { status: 500 }
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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
