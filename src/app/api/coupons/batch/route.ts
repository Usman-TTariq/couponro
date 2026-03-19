import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCouponsRaw, insertCoupon, updateCoupon } from "@/lib/stores";
import { couponImportDedupeKey } from "@/lib/coupon-import-dedupe";
import type { Store } from "@/types/store";
import { slugify } from "@/lib/slugify";

function newId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function parsePriority(b: unknown): number {
  if (typeof b === "number" && !Number.isNaN(b)) return b;
  const n = parseInt(String(b ?? "0").trim(), 10);
  return Number.isNaN(n) ? 0 : Math.max(0, n);
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

    const existingList = await getCouponsRaw();
    const byKey = new Map<string, Store>();
    for (const ex of existingList) {
      const k = couponImportDedupeKey(ex);
      if (!byKey.has(k)) byKey.set(k, ex);
    }

    let created = 0;
    let updated = 0;

    for (let i = 0; i < items.length; i++) {
      const b = items[i];
      const name = typeof b?.name === "string" ? b.name.trim() : "";
      if (!name) continue;

      const slug = (typeof b?.slug === "string" ? b.slug.trim() : "") || slugify(name);
      const couponCode = typeof b?.couponCode === "string" ? b.couponCode : "";
      const couponType: "code" | "deal" =
        b?.couponType === "deal"
          ? "deal"
          : b?.couponType === "code"
            ? "code"
            : couponCode.trim().length > 0
              ? "code"
              : "deal";
      const couponTitle = typeof b?.couponTitle === "string" ? b.couponTitle : "";
      const description = typeof b?.description === "string" ? b.description : "";
      const link =
        typeof b?.link === "string" && b.link.trim() ? b.link.trim() : undefined;
      const priority = parsePriority(b?.priority);
      const status = b?.status === "disable" ? "disable" : "enable";
      const active = b?.active !== false;

      const candidate: Pick<
        Store,
        | "name"
        | "couponCode"
        | "couponTitle"
        | "description"
        | "link"
      > = {
        name,
        couponCode,
        couponTitle,
        description,
        link,
      };
      const key = couponImportDedupeKey(candidate);
      const existing = byKey.get(key);

      if (existing) {
        const merged: Store = {
          ...existing,
          name,
          slug,
          logoUrl: typeof b?.logoUrl === "string" ? b.logoUrl : existing.logoUrl ?? "",
          description,
          expiry: typeof b?.expiry === "string" ? b.expiry : existing.expiry ?? "Dec 31, 2026",
          link,
          status,
          couponType,
          couponCode,
          couponTitle,
          showCodeButtonText:
            typeof b?.showCodeButtonText === "string"
              ? b.showCodeButtonText.trim() || undefined
              : existing.showCodeButtonText,
          badgeLabel:
            typeof b?.badgeLabel === "string" ? b.badgeLabel || undefined : existing.badgeLabel,
          priority,
          active,
          id: existing.id,
          createdAt: existing.createdAt,
        };
        await updateCoupon(existing.id, merged);
        byKey.set(key, merged);
        updated++;
      } else {
        const id = typeof b?.id === "string" && b.id.trim() ? b.id.trim() : newId();
        const c: Store = {
          id,
          name,
          slug,
          logoUrl: typeof b?.logoUrl === "string" ? b.logoUrl : "",
          description,
          expiry: typeof b?.expiry === "string" ? b.expiry : "Dec 31, 2026",
          link,
          createdAt: new Date().toISOString(),
          status,
          couponType,
          couponCode,
          couponTitle,
          showCodeButtonText:
            typeof b?.showCodeButtonText === "string"
              ? b.showCodeButtonText.trim() || undefined
              : undefined,
          badgeLabel: typeof b?.badgeLabel === "string" ? b.badgeLabel || undefined : undefined,
          priority,
          active,
        };
        await insertCoupon(c);
        byKey.set(key, c);
        created++;
      }
    }

    revalidateTag("coupons");
    return NextResponse.json({
      ok: true,
      created,
      updated,
      total: created + updated,
    });
  } catch (e) {
    console.error("[api/coupons/batch] POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create coupons" },
      { status: 500 }
    );
  }
}
