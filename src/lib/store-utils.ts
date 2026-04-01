import type { Store } from "@/types/store";

/** True if this row has coupon data (code, title, or outbound link for deals). */
export function hasCouponData(s: {
  couponCode?: string;
  couponTitle?: string;
  link?: string;
  trackingUrl?: string;
}): boolean {
  const code = (s.couponCode ?? "").trim();
  const title = (s.couponTitle ?? "").trim();
  const link = (s.link ?? "").trim() || (s.trackingUrl ?? "").trim();
  return code !== "" || title !== "" || link !== "";
}
