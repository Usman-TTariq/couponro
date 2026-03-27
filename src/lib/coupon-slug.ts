import type { Store } from "@/types/store";
import { slugify } from "@/lib/slugify";

export function getCouponDisplayTitle(coupon: Store): string {
  return (
    coupon.couponTitle?.trim() ||
    coupon.badgeLabel?.trim() ||
    coupon.description?.trim() ||
    `${coupon.name ?? "Coupon"} offer`
  );
}

/** Title-only segment (coupon headline). */
export function getCouponPageSlug(coupon: Store): string {
  return slugify(getCouponDisplayTitle(coupon));
}

/** First URL segment from store name: `/coupon/{this}/...` */
export function getStoreSlugSegment(coupon: Store): string {
  return slugify((coupon.name ?? "store").trim() || "store");
}

/** Canonical coupon URL: `/coupon/{store-slug}/{title-slug}` */
export function getCouponDetailPath(coupon: Store): string {
  const storeSeg = getStoreSlugSegment(coupon);
  const titleSeg = getCouponPageSlug(coupon);
  return `/coupon/${encodeURIComponent(storeSeg)}/${encodeURIComponent(titleSeg)}`;
}

