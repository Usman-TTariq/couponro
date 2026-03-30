"use client";

import { useState } from "react";
import type { Store } from "@/types/store";
import CopyCouponCode from "@/components/CopyCouponCode";
import CouponPopup from "@/components/CouponPopup";

type Props = {
  coupon: Store;
  trackingUrl?: string;
  storeLogoUrl?: string;
};

export default function CouponCodeAction({ coupon, trackingUrl, storeLogoUrl }: Props) {
  const [open, setOpen] = useState(false);
  const code = (coupon.couponCode ?? (coupon as Record<string, unknown>).coupon_code ?? "").toString().trim();

  return (
    <>
      <CopyCouponCode
        code={code}
        buttonText="GET CODE"
        showViewTermsHint
        hiddenText="CLICK GET CODE"
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

