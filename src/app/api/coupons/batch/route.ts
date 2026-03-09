import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { insertCoupon } from "@/lib/stores";
import type { Store } from "@/types/store";
import { slugify } from "@/lib/slugify";

function newId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const MAX_BATCH = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body?.coupons) ? body.coupons : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "coupons array required" }, { status: 400 });
    }
    if (items.length > MAX_BATCH) {
      return NextResponse.json(
        { error: `Max ${MAX_BATCH} coupons per batch` },
        { status: 400 }
      );
    }
    const coupons: Store[] = [];
    for (let i = 0; i < items.length; i++) {
      const b = items[i];
      const name = typeof b?.name === "string" ? b.name.trim() : "";
      if (!name) continue;
      const slug = b?.slug?.trim() || slugify(name);
      const id = b?.id?.trim() || newId();
      coupons.push({
        id,
        name,
        slug,
        logoUrl: b?.logoUrl ?? "",
        description: b?.description ?? "",
        expiry: b?.expiry ?? "Dec 31, 2026",
        link: b?.link ?? undefined,
        createdAt: new Date().toISOString(),
        status: b?.status ?? "enable",
        couponType: b?.couponType ?? "code",
        couponCode: b?.couponCode ?? "",
        couponTitle: b?.couponTitle ?? "",
        badgeLabel: b?.badgeLabel ?? undefined,
        priority: typeof b?.priority === "number" ? b.priority : 100,
        active: b?.active !== false,
      });
    }
    for (const c of coupons) {
      await insertCoupon(c);
    }
    revalidateTag("coupons");
    return NextResponse.json({ ok: true, count: coupons.length });
  } catch (e) {
    console.error("[api/coupons/batch] POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create coupons" },
      { status: 500 }
    );
  }
}
