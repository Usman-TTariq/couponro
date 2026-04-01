import { unstable_cache } from "next/cache";
import type { Store } from "@/types/store";
import {
  getSupabase,
  getSupabaseCoupons,
  SUPABASE_STORES_TABLE,
  SUPABASE_COUPONS_TABLE,
} from "./supabase-server";
import { slugify } from "./slugify";

const CACHE_REVALIDATE = 15; // seconds – balance freshness (after delete/add) vs Supabase load

/** Delays between attempts (ms). Third attempt has no extra delay before throw. */
const FETCH_RETRY_DELAYS_MS = [120, 350] as const;

/**
 * Retries transient Supabase failures so we don't cache empty lists or show "not found"
 * when the DB briefly errored. On final failure, rethrows (not cached as success).
 */
async function withRetry<T>(tag: string, fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) {
        const delay = FETCH_RETRY_DELAYS_MS[attempt - 1] ?? 400;
        await new Promise((r) => setTimeout(r, delay));
        console.warn(`[${tag}] attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`, e);
      }
    }
  }
  throw lastError;
}

function requireSupabase() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return supabase;
}

async function getStoresRaw(): Promise<Store[]> {
  return withRetry("stores", async () => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data: rows, error } = await supabase
      .from(SUPABASE_STORES_TABLE)
      .select("data");
    if (error) {
      console.error("[stores] Supabase error:", error.message);
      throw new Error(`Supabase stores: ${error.message}`);
    }
    const stores = (rows ?? [])
      .map((r: { data: Store }) => r.data)
      .filter(Boolean) as Store[];
    stores.sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
    return stores;
  });
}

export const getStores = unstable_cache(
  getStoresRaw,
  ["stores-list"],
  { revalidate: CACHE_REVALIDATE, tags: ["stores"] }
);

function requireSupabaseCoupons() {
  const supabase = getSupabaseCoupons();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured for coupons. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or COUPONS_SUPABASE_URL and COUPONS_SERVICE_ROLE_KEY in .env"
    );
  }
  return supabase;
}

/** Returns exact row count from DB (for correct admin total). */
export async function getCouponsCountFromDb(): Promise<number> {
  const supabase = getSupabaseCoupons();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from(SUPABASE_COUPONS_TABLE)
    .select("id", { count: "exact", head: true });
  if (error) {
    console.error("[coupons] count error:", error.message);
    return 0;
  }
  return typeof count === "number" ? count : 0;
}

const COUPONS_PAGE_SIZE = 1000;

/** Parse JSON strings up to `maxDepth` times (double-encoded exports / legacy rows). */
function tryParseJsonDeep(raw: unknown, maxDepth: number): unknown {
  let d = raw;
  for (let i = 0; i < maxDepth && typeof d === "string"; i++) {
    const s = d.trim();
    if (!s) return null;
    try {
      d = JSON.parse(s);
    } catch {
      return null;
    }
  }
  return d;
}

function pickStr(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** Map one `coupons` table row (id + jsonb data) to Store. */
function couponRowToStore(rowId: string, raw: unknown): Store {
  const empty = { id: rowId, name: "", logoUrl: "", description: "", expiry: "" } as Store;
  let d = tryParseJsonDeep(raw, 6);
  if (!d || typeof d !== "object" || Array.isArray(d)) return empty;

  let o = { ...(d as Record<string, unknown>) };

  // Nested: { id, data: "<json>" | { ...coupon } } when top-level lacks coupon fields
  const nest = o["data"];
  const hasTopCoupon =
    pickStr(o, ["name", "store_name", "storeName"]) ||
    pickStr(o, ["couponTitle", "coupon_title"]) ||
    pickStr(o, ["couponCode", "coupon_code"]);
  if (!hasTopCoupon && nest != null) {
    const inner = tryParseJsonDeep(nest, 4);
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      o = { ...o, ...(inner as Record<string, unknown>) };
    }
  }

  const base = o as unknown as Store;
  const name = pickStr(o, ["name", "store_name", "storeName"]) ?? (base.name ?? "");
  const couponCode = pickStr(o, ["couponCode", "coupon_code"]) ?? (base.couponCode ?? "");
  const couponTitle = pickStr(o, ["couponTitle", "coupon_title"]) ?? (base.couponTitle ?? "");
  const linkPick = pickStr(o, ["link", "url"]);
  const trackingPick = pickStr(o, ["trackingUrl", "tracking_url"]);
  const link = linkPick ?? trackingPick ?? base.link;
  const trackingUrl = trackingPick ?? linkPick ?? base.trackingUrl ?? base.link;

  return {
    ...base,
    id: pickStr(o, ["id"]) || rowId,
    name,
    couponCode,
    couponTitle,
    ...(link ? { link } : {}),
    ...(trackingUrl ? { trackingUrl } : {}),
  };
}

/** Fetch all coupon rows (PostgREST default max ~1000 per request — paginate). */
async function fetchAllCouponRows(): Promise<{ id: string; data: unknown }[]> {
  const supabase = getSupabaseCoupons();
  if (!supabase) return [];
  const out: { id: string; data: unknown }[] = [];
  let from = 0;
  for (;;) {
    const { data: rows, error } = await supabase
      .from(SUPABASE_COUPONS_TABLE)
      .select("id, data")
      .range(from, from + COUPONS_PAGE_SIZE - 1);
    if (error) {
      console.error("[coupons] Supabase error:", error.message);
      throw new Error(`Supabase coupons: ${error.message}`);
    }
    const batch = rows ?? [];
    out.push(...batch);
    if (batch.length < COUPONS_PAGE_SIZE) break;
    from += COUPONS_PAGE_SIZE;
  }
  return out;
}

export async function getCouponsRaw(): Promise<Store[]> {
  return withRetry("coupons", async () => {
    const rows = await fetchAllCouponRows();
    const coupons = rows.map((r) => couponRowToStore(r.id ?? "", r.data)) as Store[];
    coupons.sort((a, b) => {
      const pa = a.priority ?? 999;
      const pb = b.priority ?? 999;
      if (pa !== pb) return pa - pb;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
    return coupons;
  });
}

export const getCoupons = unstable_cache(
  getCouponsRaw,
  ["coupons-list"],
  { revalidate: CACHE_REVALIDATE, tags: ["coupons"] }
);

export type CouponsPaginatedOptions = {
  page: number;
  limit: number;
  status?: "all" | "enable" | "disable";
  search?: string;
  codesFirst?: boolean;
};

function hasCode(c: Store): boolean {
  const code = (c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "").toString().trim();
  return code.length > 0;
}

export async function getCouponById(id: string): Promise<Store | null> {
  if (!id?.trim()) return null;
  const all = await getCoupons();
  return all.find((c) => (c.id ?? "").trim() === id.trim()) ?? null;
}

export async function getCouponsPaginated(
  options: CouponsPaginatedOptions,
  useFreshData?: boolean
): Promise<{ coupons: Store[]; total: number }> {
  const all = useFreshData ? await getCouponsRaw() : await getCoupons();
  let list = all;
  if (options.status && options.status !== "all") {
    list = list.filter((c) => (c.status ?? "enable") === options.status);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.id ?? "").toLowerCase().includes(q) ||
        (c.couponTitle ?? "").toLowerCase().includes(q) ||
        (c.couponCode ?? "").toLowerCase().includes(q) ||
        (c.link ?? "").toLowerCase().includes(q) ||
        (c.trackingUrl ?? "").toLowerCase().includes(q)
    );
  }
  if (options.codesFirst) {
    list = [...list].sort((a, b) => (hasCode(b) ? 1 : 0) - (hasCode(a) ? 1 : 0));
  }
  const totalFromList = list.length;
  // Always use list length for pagination total. DB head-count can exceed rows returned (PostgREST limits)
  // or diverge from parsed/filtered list — that made coupons look "missing" on admin pages.
  const totalToUse = totalFromList;
  if (options.limit <= 0) return { coupons: list, total: totalToUse };
  const start = (options.page - 1) * options.limit;
  const coupons = list.slice(start, start + options.limit);
  return { coupons, total: totalToUse };
}

export async function deleteAllCoupons(): Promise<void> {
  const supabase = requireSupabaseCoupons();
  const { data: rows, error: selectErr } = await supabase
    .from(SUPABASE_COUPONS_TABLE)
    .select("id");
  if (selectErr) throw new Error(selectErr.message);
  const ids = (rows ?? []).map((r: { id: string }) => r.id).filter(Boolean);
  if (ids.length === 0) return;
  const { error } = await supabase.from(SUPABASE_COUPONS_TABLE).delete().in("id", ids);
  if (error) throw new Error(error.message);
}

export async function insertStore(store: Store): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(SUPABASE_STORES_TABLE)
    .insert({ id: store.id, data: store });
  if (error) throw new Error(error.message);
}

export async function updateStore(id: string, store: Store): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(SUPABASE_STORES_TABLE)
    .update({ data: store })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStore(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(SUPABASE_STORES_TABLE)
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertCoupon(coupon: Store): Promise<void> {
  const supabase = requireSupabaseCoupons();
  const { error } = await supabase
    .from(SUPABASE_COUPONS_TABLE)
    .insert({ id: coupon.id, data: coupon });
  if (error) throw new Error(error.message);
}

export async function updateCoupon(id: string, coupon: Store): Promise<void> {
  const supabase = requireSupabaseCoupons();
  const { error } = await supabase
    .from(SUPABASE_COUPONS_TABLE)
    .update({ data: coupon })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCoupon(id: string): Promise<void> {
  const supabase = requireSupabaseCoupons();
  const { error } = await supabase
    .from(SUPABASE_COUPONS_TABLE)
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Update all coupons that belong to a store (by name match) to use the given slug.
 * Call after updating a store's slug so store page continues to show those coupons.
 */
export async function updateCouponSlugsForStoreName(
  storeName: string,
  newSlug: string
): Promise<number> {
  const slug = (newSlug ?? "").trim();
  if (!slug) return 0;
  const nameKey = (storeName ?? "").trim().toLowerCase();
  if (!nameKey) return 0;
  const coupons = await getCouponsRaw();
  let updated = 0;
  for (const c of coupons) {
    if ((c.name ?? "").trim().toLowerCase() !== nameKey) continue;
    const currentSlug = (c.slug ?? slugify(c.name ?? "")).trim();
    if (currentSlug === slug) continue;
    await updateCoupon(c.id, { ...c, slug });
    updated++;
  }
  return updated;
}

/**
 * Sync every coupon's slug to its store's slug (match by store name).
 * Use after changing store slugs in admin so all coupons show on the correct store page.
 */
export async function syncCouponSlugsFromStores(): Promise<{ updated: number }> {
  const [stores, coupons] = await Promise.all([getStores(), getCouponsRaw()]);
  let updated = 0;
  for (const c of coupons) {
    const nameKey = (c.name ?? "").trim().toLowerCase();
    if (!nameKey) continue;
    const store = stores.find((s) => (s.name ?? "").trim().toLowerCase() === nameKey);
    if (!store) continue;
    const wantSlug = (store.slug ?? slugify(store.name ?? "")).trim();
    if (!wantSlug) continue;
    const currentSlug = (c.slug ?? slugify(c.name ?? "")).trim();
    if (currentSlug === wantSlug) continue;
    await updateCoupon(c.id, { ...c, slug: wantSlug });
    updated++;
  }
  return { updated };
}

export { slugify } from "./slugify";
export { hasCouponData } from "./store-utils";
