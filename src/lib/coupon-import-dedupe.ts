import type { Store } from "@/types/store";

/**
 * Stable key for CSV/batch import: same row re-uploaded → same key (no duplicate rows).
 * Uses store name, code, title, description, link (trimmed; name/code lowercased).
 */
export function couponImportDedupeKey(
  c: Pick<Store, "name" | "couponCode" | "couponTitle" | "description" | "link">
): string {
  return [
    (c.name ?? "").trim().toLowerCase(),
    (c.couponCode ?? "").trim().toLowerCase(),
    (c.couponTitle ?? "").trim(),
    (c.description ?? "").trim(),
    (c.link ?? "").trim(),
  ].join("\u001f");
}
