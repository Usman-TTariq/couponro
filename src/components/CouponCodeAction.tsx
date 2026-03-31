"use client";

import { useState } from "react";
import type { Store } from "@/types/store";
import CopyCouponCode from "@/components/CopyCouponCode";
import CouponPopup from "@/components/CouponPopup";
import { getShowCodeButtonLabel } from "@/lib/coupon-button-labels";

type Props = {
  coupon: Store;
  trackingUrl?: string;
  storeLogoUrl?: string;
};

export default function CouponCodeAction({ coupon, trackingUrl, storeLogoUrl }: Props) {
  const [open, setOpen] = useState(false);
  const code = (coupon.couponCode ?? (coupon as Record<string, unknown>).coupon_code ?? "").toString().trim();
  const buttonLabel = getShowCodeButtonLabel(coupon);

  return (
    <>
      <CopyCouponCode
        code={code}
        buttonText={buttonLabel.toUpperCase()}
        showViewTermsHint
        hiddenText={`CLICK ${buttonLabel.toUpperCase()}`}
        urlToOpen={trackingUrl}
        onAfterClick={() => setOpen(true)}
      />
      <CouponPopup
        coupon={open ? coupon : null}
        onClose={() => setOpen(false)}
        storeLogoUrl={storeLogoUrl}
        fallbackUrl={trackingUrl}
      />
    </>
  );
}

