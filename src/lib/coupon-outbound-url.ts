import type { Store } from "@/types/store";

type StoreFallback = Pick<Store, "trackingUrl" | "storeWebsiteUrl">;

/** URL opened when user clicks Get Code / Get Deal. Admin "Coupon URL" (`link`) wins. */
export function getCouponOutboundUrl(
  coupon: Pick<Store, "link" | "trackingUrl" | "storeWebsiteUrl">,
  store?: StoreFallback | null
): string {
  return (
    coupon.link?.trim() ||
    coupon.trackingUrl?.trim() ||
    coupon.storeWebsiteUrl?.trim() ||
    store?.trackingUrl?.trim() ||
    store?.storeWebsiteUrl?.trim() ||
    ""
  );
}
