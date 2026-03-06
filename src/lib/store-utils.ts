import type { Store } from "@/types/store";

/** True if this row has coupon data (code or deal title). */
export function hasCouponData(s: {
  couponCode?: string;
  couponTitle?: string;
}): boolean {
  const code = (s.couponCode ?? "").trim();
  const title = (s.couponTitle ?? "").trim();
  return code !== "" || title !== "";
}
