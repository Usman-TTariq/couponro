import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coupon Codes & Promo Codes",
  description:
    "Browse verified coupon codes and promo codes from top stores. Get the best discounts and deals updated daily at Couponro.",
};

export default function CouponsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
