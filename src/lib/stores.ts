import { unstable_cache } from "next/cache";
import type { Store } from "@/types/store";
import {
  getSupabase,
  getSupabaseCoupons,
  SUPABASE_STORES_TABLE,
  SUPABASE_COUPONS_TABLE,
} from "./supabase-server";
import { slugify } from "./slugify";
import { repairCouponTextFields } from "./fix-text-encoding";

const CACHE_REVALIDATE = 15; // seconds – balance freshness (after delete/add) vs Supabase load

/** Delays between attempts (ms). Third attempt has no extra delay before throw. */
const FETCH_RETRY_DELAYS_MS = [120, 350] as const;

/** PostgREST sometimes returns Cloudflare HTML (5xx) as `error.message` — keep logs readable. */
function summarizeSupabaseErrorMessage(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "Unknown error";
  if (s.includes("522") || /connection timed out/i.test(s)) {
    return "Cloudflare 522 / connection timed out (Supabase origin slow or unreachable). See https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-522/";
  }
  if (s.startsWith("<!DOCTYPE") || s.startsWith("<html") || (s.includes("<span>") && s.includes("Error 52"))) {
    return "Upstream returned HTML instead of JSON (often Cloudflare 5xx in front of Supabase). Check https://status.supabase.com and that the project is not paused.";
  }
  if (s.length > 500) return `${s.slice(0, 200)}… [truncated, length ${s.length}]`;
  return s;
}

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
      .select("id, data");
    if (error) {
      const msg = summarizeSupabaseErrorMessage(error.message);
      console.error("[stores] Supabase error:", msg);
      throw new Error(`Supabase stores: ${msg}`);
    }
    const stores = (rows ?? [])
      .map((r: { id: string; data: Store }) => {
        if (!r.data) return null;
        return repairCouponTextFields({
          ...r.data,
          id: r.id || r.data.id || "",
        } as Store);
      })
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

/** Single store by row id — avoids loading the full stores list on update. */
export async function getStoreById(id: string): Promise<Store | null> {
  const trimmed = (id ?? "").trim();
  if (!trimmed) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: row, error } = await supabase
    .from(SUPABASE_STORES_TABLE)
    .select("id, data")
    .eq("id", trimmed)
    .maybeSingle();
  if (error) {
    const msg = summarizeSupabaseErrorMessage(error.message);
    throw new Error(`Supabase store: ${msg}`);
  }
  if (!row?.data) return null;
  const r = row as { id: string; data: Store };
  return repairCouponTextFields({
    ...r.data,
    id: r.id || r.data.id || "",
  } as Store);
}

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

  return repairCouponTextFields({
    ...base,
    id: pickStr(o, ["id"]) || rowId,
    name,
    couponCode,
    couponTitle,
    ...(link ? { link } : {}),
    ...(trackingUrl ? { trackingUrl } : {}),
  });
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
      const msg = summarizeSupabaseErrorMessage(error.message);
      console.error("[coupons] Supabase error:", msg);
      throw new Error(`Supabase coupons: ${msg}`);
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

const COUPON_UPDATE_BATCH = 10;

/**
 * After store update: one coupon fetch, parallel updates. Skips work when name/slug unchanged.
 */
export async function syncCouponsAfterStoreUpdate(opts: {
  oldName: string;
  newName: string;
  newSlug: string;
}): Promise<{ renamed: number; slugSynced: number }> {
  const oldKey = (opts.oldName ?? "").trim().toLowerCase();
  const newNameTrim = (opts.newName ?? "").trim();
  const newSlug = (opts.newSlug ?? "").trim();
  const nameChanged =
    !!oldKey && !!newNameTrim && oldKey !== newNameTrim.toLowerCase();
  const nameKeyForMatch = nameChanged ? oldKey : newNameTrim.toLowerCase();
  if (!nameKeyForMatch) return { renamed: 0, slugSynced: 0 };

  const coupons = await getCouponsRaw();
  const matching = coupons.filter(
    (c) => (c.name ?? "").trim().toLowerCase() === nameKeyForMatch
  );
  if (matching.length === 0) return { renamed: 0, slugSynced: 0 };

  const pending: Array<{ id: string; coupon: Store }> = [];
  let renamed = 0;
  let slugSynced = 0;

  for (const c of matching) {
    const next = { ...c };
    let changed = false;
    if (nameChanged) {
      next.name = newNameTrim;
      changed = true;
      renamed++;
    }
    if (newSlug) {
      const currentSlug = (next.slug ?? slugify(next.name ?? "")).trim();
      if (currentSlug !== newSlug) {
        next.slug = newSlug;
        changed = true;
        slugSynced++;
      }
    }
    if (changed) pending.push({ id: c.id, coupon: next });
  }

  for (let i = 0; i < pending.length; i += COUPON_UPDATE_BATCH) {
    const batch = pending.slice(i, i + COUPON_UPDATE_BATCH);
    await Promise.all(batch.map(({ id, coupon }) => updateCoupon(id, coupon)));
  }

  return { renamed, slugSynced };
}

/** @deprecated Use syncCouponsAfterStoreUpdate */
export async function updateCouponsNameForStoreRename(
  oldName: string,
  newName: string
): Promise<number> {
  const { renamed } = await syncCouponsAfterStoreUpdate({
    oldName,
    newName,
    newSlug: "",
  });
  return renamed;
}

/** @deprecated Use syncCouponsAfterStoreUpdate */
export async function updateCouponSlugsForStoreName(
  storeName: string,
  newSlug: string
): Promise<number> {
  const { slugSynced } = await syncCouponsAfterStoreUpdate({
    oldName: storeName,
    newName: storeName,
    newSlug,
  });
  return slugSynced;
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
