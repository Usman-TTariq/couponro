import type { Store } from "@/types/store";

/** Extract $/%-style discount from text when present */
export function parseDiscountFromText(text: string): string {
  const m = text.match(/(\$\d+(?:\.\d{1,2})?|\d+\s*%|%\s*off)/i);
  return m ? m[1].replace(/\s+/g, "").toUpperCase() : "";
}

export function couponHasFreeShipping(c: Store): boolean {
  if (c.freeShipping === true) return true;
  const raw = c as Record<string, unknown>;
  return raw.free_shipping === true || raw.freeShipping === true;
}

function hasCouponCode(c: Store): boolean {
  const code = c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "";
  return String(code).trim().length > 0;
}

function formatCustomBadge(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const parsed = parseDiscountFromText(trimmed);
  if (parsed) return parsed;
  const upper = trimmed.toUpperCase();
  if (upper.length <= 16) return upper;
  const words = upper.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.join("\n");
  }
  return `${upper.slice(0, 14)}…`;
}

/**
 * Text inside the circular badge on coupon cards.
 * badgeLabel is shown when set; otherwise %/$ from couponTitle; else CODE/DEAL.
 */
export function getCouponCircleBadge(c: Store): string {
  if (couponHasFreeShipping(c)) {
    return "FREE\nSHIPPING";
  }
  const badge = (c.badgeLabel ?? "").trim();
  if (badge) {
    const formatted = formatCustomBadge(badge);
    if (formatted) return formatted;
  }
  const title = (c.couponTitle ?? "").trim();
  if (title) {
    const parsed = parseDiscountFromText(title);
    if (parsed) return parsed;
  }
  return hasCouponCode(c) ? "CODE" : "DEAL";
}

export function isDefaultCircleBadge(label: string): boolean {
  return label === "CODE" || label === "DEAL";
}
