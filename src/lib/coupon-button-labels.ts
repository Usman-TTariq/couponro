import type { Store } from "@/types/store";

/** Default when admin leaves custom text empty (matches Coupons admin copy). */
const DEFAULT_SHOW_CODE = "Get Code";

const DEFAULT_GET_DEAL = "Get Deal";

function hasActualCode(c: Store): boolean {
  return Boolean(
    (c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "").toString().trim().length > 0
  );
}

/** Label for the reveal-code button on store/coupons listing cards. */
export function getShowCodeButtonLabel(coupon: Store): string {
  const t = (coupon.showCodeButtonText ?? "").trim();
  if (t) return t;
  const type = (coupon.couponType ?? "").toLowerCase();
  if (type === "deal" && !hasActualCode(coupon)) return DEFAULT_GET_DEAL;
  return DEFAULT_SHOW_CODE;
}
