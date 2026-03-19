import type { Store } from "@/types/store";

/** Default when admin leaves custom text empty (matches Coupons admin copy). */
const DEFAULT_SHOW_CODE = "Get Code";

/** Label for the reveal-code button on store/coupons listing cards. */
export function getShowCodeButtonLabel(coupon: Store): string {
  const t = (coupon.showCodeButtonText ?? "").trim();
  return t || DEFAULT_SHOW_CODE;
}
