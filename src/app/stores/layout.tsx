import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stores – Shop Coupons by Store",
  description:
    "Find your favorite stores and their latest coupon codes, deals, and free shipping offers. Browse all stores at Couponro.",
};

export default function StoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
