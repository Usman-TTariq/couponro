import { unstable_cache } from "next/cache";
import type { Store } from "@/types/store";
import {
  getSupabase,
  SUPABASE_STORES_TABLE,
  SUPABASE_COUPONS_TABLE,
} from "./supabase-server";

const CACHE_REVALIDATE = 60; // seconds – reduce Supabase load and speed up repeat visits

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
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data: rows, error } = await supabase
    .from(SUPABASE_STORES_TABLE)
    .select("data");
  if (error) {
    console.error("[stores] Supabase error:", error.message);
    return [];
  }
  const stores = (rows ?? [])
    .map((r: { data: Store }) => r.data)
    .filter(Boolean) as Store[];
  stores.sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );
  return stores;
}

export const getStores = unstable_cache(
  getStoresRaw,
  ["stores-list"],
  { revalidate: CACHE_REVALIDATE, tags: ["stores"] }
);

async function getCouponsRaw(): Promise<Store[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data: rows, error } = await supabase
    .from(SUPABASE_COUPONS_TABLE)
    .select("id, data");
  if (error) {
    console.error("[coupons] Supabase error:", error.message);
    return [];
  }
  const coupons = (rows ?? []).map((r: { id: string; data: Store | null }) => {
    const d = r?.data;
    const id = r?.id;
    if (!d || typeof d !== "object")
      return { id: id ?? "", name: "", logoUrl: "", description: "", expiry: "" } as Store;
    return { ...d, id: d.id ?? id };
  }) as Store[];
  coupons.sort((a, b) => {
    const pa = a.priority ?? 999;
    const pb = b.priority ?? 999;
    if (pa !== pb) return pa - pb;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
  return coupons;
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
  options: CouponsPaginatedOptions
): Promise<{ coupons: Store[]; total: number }> {
  const all = await getCoupons();
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
        (c.couponCode ?? "").toLowerCase().includes(q)
    );
  }
  if (options.codesFirst) {
    list = [...list].sort((a, b) => (hasCode(b) ? 1 : 0) - (hasCode(a) ? 1 : 0));
  }
  const total = list.length;
  if (options.limit <= 0) return { coupons: list, total };
  const start = (options.page - 1) * options.limit;
  const coupons = list.slice(start, start + options.limit);
  return { coupons, total };
}

export async function deleteAllCoupons(): Promise<void> {
  const supabase = requireSupabase();
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
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(SUPABASE_COUPONS_TABLE)
    .insert({ id: coupon.id, data: coupon });
  if (error) throw new Error(error.message);
}

export async function updateCoupon(id: string, coupon: Store): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(SUPABASE_COUPONS_TABLE)
    .update({ data: coupon })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCoupon(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(SUPABASE_COUPONS_TABLE)
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export { slugify } from "./slugify";
export { hasCouponData } from "./store-utils";
