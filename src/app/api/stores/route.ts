import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getStores,
  insertStore,
  updateStore,
  deleteStore,
  updateCouponSlugsForStoreName,
} from "@/lib/stores";
import type { Store } from "@/types/store";
import { slugify } from "@/lib/slugify";

function newId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function pickStoreFromBody(body: Record<string, unknown>, existing?: Store): Store {
  const name = typeof body?.name === "string" ? body.name.trim() : (existing?.name ?? "");
  const slug =
    (typeof body?.slug === "string" ? body.slug.trim() : null) ||
    (body?.autoGenerateSlug !== false && name ? slugify(name) : "") ||
    existing?.slug ||
    slugify(name);
  const id = (typeof body?.id === "string" ? body.id.trim() : null) || existing?.id || newId();

  const arr = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined;
  const faqs = body?.faqs;
  const faqList =
    Array.isArray(faqs) &&
    faqs.every(
      (f: unknown) =>
        f && typeof f === "object" && "question" in f && "answer" in f
    )
      ? (faqs as { question: string; answer: string }[])
      : undefined;

  return {
    id,
    name,
    slug,
    logoUrl: typeof body?.logoUrl === "string" ? body.logoUrl : (existing?.logoUrl ?? ""),
    description: typeof body?.description === "string" ? body.description : (existing?.description ?? ""),
    expiry: typeof body?.expiry === "string" ? body.expiry : (existing?.expiry ?? "Dec 31, 2026"),
    link: typeof body?.link === "string" ? body.link : existing?.link,
    createdAt: (typeof body?.createdAt === "string" ? body.createdAt : null) ?? existing?.createdAt ?? new Date().toISOString(),
    status: body?.status === "disable" ? "disable" : "enable",

    subStoreName: typeof body?.subStoreName === "string" ? body.subStoreName : existing?.subStoreName,
    storePageHeading: typeof body?.storePageHeading === "string" ? body.storePageHeading : existing?.storePageHeading,
    autoGenerateSlug: body?.autoGenerateSlug === true || (existing?.autoGenerateSlug !== false && body?.autoGenerateSlug !== false),
    logoAltText: typeof body?.logoAltText === "string" ? body.logoAltText : existing?.logoAltText,
    logoUploadMethod: body?.logoUploadMethod === "upload" ? "upload" : (existing?.logoUploadMethod ?? "url"),

    trackingUrl: typeof body?.trackingUrl === "string" ? body.trackingUrl : existing?.trackingUrl,
    countryCodes: typeof body?.countryCodes === "string" ? body.countryCodes : existing?.countryCodes,
    storeWebsiteUrl: typeof body?.storeWebsiteUrl === "string" ? body.storeWebsiteUrl : existing?.storeWebsiteUrl,

    categories: arr(body?.categories) ?? existing?.categories,
    whyTrustUs: typeof body?.whyTrustUs === "string" ? body.whyTrustUs : existing?.whyTrustUs,
    moreInformation: typeof body?.moreInformation === "string" ? body.moreInformation : existing?.moreInformation,
    sidebarContent: typeof body?.sidebarContent === "string" ? body.sidebarContent : existing?.sidebarContent,
    moreAboutStore: typeof body?.moreAboutStore === "string" ? body.moreAboutStore : existing?.moreAboutStore,
    shoppingTipsTitle: typeof body?.shoppingTipsTitle === "string" ? body.shoppingTipsTitle : existing?.shoppingTipsTitle,
    shoppingTipsBullets: arr(body?.shoppingTipsBullets) ?? existing?.shoppingTipsBullets,
    faqs: faqList ?? existing?.faqs,

    seoPageTitle: typeof body?.seoPageTitle === "string" ? body.seoPageTitle : existing?.seoPageTitle,
    seoMetaDescription: typeof body?.seoMetaDescription === "string" ? body.seoMetaDescription : existing?.seoMetaDescription,

    markAsTrending: body?.markAsTrending === true || existing?.markAsTrending === true,
  };
}

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=0, must-revalidate",
};

export async function GET() {
  try {
    const stores = await getStores();
    return NextResponse.json(stores, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error("[api/stores] GET:", e);
    return NextResponse.json(
      { error: "Failed to load stores" },
      { status: 500 }
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
    const store = pickStoreFromBody(body);
    store.createdAt = new Date().toISOString();
    await insertStore(store);
    revalidateTag("stores");
    return NextResponse.json(store);
  } catch (e) {
    console.error("[api/stores] POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create store" },
      { status: 500 }
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
    const stores = await getStores();
    const existing = stores.find((s) => s.id === id) ?? null;
    const store = pickStoreFromBody(body, existing ?? undefined);
    store.id = id;
    if (existing?.createdAt) store.createdAt = existing.createdAt;
    await updateStore(id, store);
    revalidateTag("stores");
    const newSlug = (store.slug ?? slugify(store.name ?? "")).trim();
    if (newSlug) {
      try {
        const synced = await updateCouponSlugsForStoreName(store.name ?? "", newSlug);
        if (synced > 0) revalidateTag("coupons");
      } catch (e) {
        console.error("[api/stores] PUT: sync coupon slugs:", e);
      }
    }
    return NextResponse.json(store);
  } catch (e) {
    console.error("[api/stores] PUT:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update store" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id query is required" },
        { status: 400 }
      );
    }
    await deleteStore(id);
    revalidateTag("stores");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/stores] DELETE:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete store" },
      { status: 500 }
    );
  }
}
